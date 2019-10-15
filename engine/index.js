'use strict';

const events = require('events');
const EventEmitter = events.EventEmitter;


const setup_ = Symbol('setup-tournament-method');
const tournaments_ = Symbol('tournament-collection');

const models = require('../models');
const Session = models.Session;

const gamestate = Object.create(EventEmitter.prototype, {

  /**
   * @private
   * @function
   * @name setup
   * @desc configure a tournament settings, and let the game begins
   *
   * @param {string} tournamentId:
   *  unique identifier for the current tournament
   * @param {Array} players:
   *  list of the player who play the current tournament;
   *  each player is an object with at least the following properties:
   *  - player.id
   *  - player.name
   *  - player.serviceUrl
   * @param {Number} gameId:
   *  specify from which game the tournament should start;
   *  it's different from 1 when the tournament is recovered after a crash.
   *
   * @returns void
   */
  [setup_]: {
    writable: process.env.NODE_ENV === 'test',
    value: async function (tournament, players, gameId, mainPlayer) {
      const gs = {};
      gs.pid = process.pid;
      gs.tournamentId = tournament.id;
      gs.tableType = tournament.tableType;
      gs.config = tournament.config;
      gs.gameProgressiveId = gameId;
      gs.handProgressiveId = 1;
      gs.mainPlayer = mainPlayer;

      gs.handUniqueId = `${gs.pid}_${gs.tournamentId}_${gs.gameProgressiveId}-${gs.handProgressiveId}`;

      logger.info('Setup tournament %s.', tournament.id, { tag: gs.handUniqueId });

      gs.players = await Promise.all(players.map(p => {
        return createPlayer(p, gs)
      }).filter(x => x != null));

      Object.defineProperties(gs, {
        'activePlayers': {
          get() {
            return this.players.filter(x => x.status === playerStatus.active);
          }
        },
        'dealerButtonIndex': {
          get() {
            return this.players.findIndex(player => player[Symbol.for('has-dealer-button')]);
          }
        }
      });

      if (gs.players.length < 3 && gs.tableType !== 'sandbox') {
        logger.info('Tournament %s waiting for more players players.', tournament.id, { tag: gs.handUniqueId });
        gs.tournamentStatus = tournamentStatus.pause;
      } else {
        gs.tournamentStatus = tournamentStatus.play;

        await Promise.all(gs.players.map(async player => {
          const data = { id: player.id, isActive: true };

          if (player.botType === 'userBot' && gs.tableType !== 'sandbox') {
            data.joinTable = gs.tournamentId;
          }

          await storage.updateBot(data);

          // this.emit('gamestate:update-bot', Object.assign({}, { id: player.id, isActive: true}));
          if (!player.sessionId && player.botType === 'userBot') {

            const session = await Session.create({
              botId: player.id,
              tableType: gs.tableType,
            });

            if (session) {
              player.sessionId = session.id;
            }
          }
        }));
      }

      await storage.updateTable({ id: tournament.id, numPlayers: gs.players.length });

      this[tournaments_].set(tournament.id, gs);

      logger.log('debug', 'Tournament players are: %s', gs.players.map(p => p.name).toString().replace(/,/g, ', '), { tag: gs.handUniqueId });

      //start the game
      return void gameloop(gs)
        .then(async function () {
          logger.info('Tournament %s is just finished.', tournament.id, { tag: gs.handUniqueId });
          this[tournaments_].delete(tournament.id);
          if (gs.tableType === 'sandbox' && !gs.sandboxError) {
            this.emit('sandbox:update', Object.assign({}, { id: gs.mainPlayer.id, gameCompleted: true }));
          }
          for (let player of gs.players) {
            await storage.updateBot({ id: player.id, isActive: false, totalWinnings: player.totalWinnings, leaveTable: gs.tournamentId });
            if (gs.tableType !== 'sandbox') {
              await storage.updateUser({ id: player.userId, chips: player.chips });
            }

            if (!gs.sandboxError) {
              await storage.endSession(player.sessionId);
            }
          }
          await storage.updateTable({ id: tournament.id, numPlayers: 0 });
          return this.emit('tournament:completed', { tournamentId: tournament.id });
        }.bind(this))
        .catch(function (err) {
          // an error occurred during the gameloop generator execution;
          // if the exception is not handled before... there's nothing here i can do.
          const errorTag = { tag: gs.handUniqueId };
          logger.error('An error occurred during tournament %s.', gs.tournamentId, errorTag);
          logger.error('Error: %s.\nStacktrace: %s', err.message, err.stack, errorTag);
        });
    }
  },



  /**
   * @function
   * @name start
   * @desc it makes a new tournament start, or resume a paused tournament
   *
   * @param {string} tournamentId:
   *  unique identifier for the current tournament
   * @param {Array} players:
   *  list of the player who play the current tournament;
   *  each player is an object with at least the following properties:
   *  - player.id
   *  - player.name
   *  - player.serviceUrl
   * @param {Number} gameId:
   *  specify from which game the tournament should start;
   *  it's different from 1 when the tournament is recovered after a crash.
   *
   * @returns void
   */
  start: {
    value: function (tournament, players, mainPlayer, gameId = 1) {
      // start has a different meaning on the basis of the fact
      // that the tournament is starting for the first time, or
      // it is resuming after a break.

      const gs = this[tournaments_].get(tournament.id);

      // a)
      // in case the tournament is starting for the first time
      // we've to setup the tournament.

      if (!gs)
        return void this[setup_](tournament, players, gameId, mainPlayer);

      // b)
      // in case the tournament has already started, and it'snt
      // currently running, we just have to activate it.

      if (gs.tournamentStatus !== tournamentStatus.pause)
        return;

      gs.tournamentStatus = tournamentStatus.play;

      //this.emit('gamestate:update-table', Object.assign({}, { id: tournament.id, numPlayers: gs.players.length }));
    }
  },

  join: {
    value: async function (tournamentId, players) {
      const gs = this[tournaments_].get(tournamentId);

      gs.players = gs.players.concat(await Promise.all(players.map(p => {
        return createPlayer(p, gs);
      }).filter(x => x != null)));

      if (gs.players.length < 3) {
        logger.info('Tournament %s waiting for more players players.', tournamentId, { tag: gs.handUniqueId });
        gs.tournamentStatus = tournamentStatus.pause;
        //this.emit('gamestate:update-table', Object.assign({}, { id: tournamentId, numPlayers: gs.players.length }));
      } else {
        gs.tournamentStatus = tournamentStatus.play;

        //this.emit('gamestate:update-table', Object.assign({}, { id: tournamentId, numPlayers: gs.players.length }));

        await Promise.all(gs.players.map(async player => {
          const data = { id: player.id, isActive: true };

          if (player.botType === 'userBot' && gs.tableType !== 'sandbox') {
            data.joinTable = gs.tournamentId;
          }

          await storage.updateBot(data);

          if (!player.sessionId && player.botType === 'userBot') {

            const session = await Session.create({
              botId: player.id,
              tableType: gs.tableType,
            });

            if (session) {
              player.sessionId = session.id;
            }
          }
        }));
      }

      await storage.updateTable({ id: tournamentId, numPlayers: gs.players.length });
    }
  },


  /**
   * @function
   * @name pause
   * @desc pause an active tournament
   *
   * @param {string} tournamentId:
   *  unique identifier for the current tournament
   *
   * @returns void
   */
  pause: {
    value: function (tournamentId) {
      const gs = this[tournaments_].get(tournamentId);

      if (gs == null)
        return;

      if (gs.tournamentStatus !== tournamentStatus.play)
        return;

      logger.info('Tournament %s is going to be paused.', gs.tournamentId, { tag: gs.tournamentId });
      gs.tournamentStatus = tournamentStatus.pause;

    }
  },


  /**
   * @function
   * @name end
   * @desc terminate an active tournament
   *
   * @param {string} tournamentId:
   *  unique identifier for the current tournament
   *
   * @returns void
   */
  end: {
    value: function (tournamentId) {
      console.log(tournamentId, this[tournaments_]);
      const gs = this[tournaments_].get(tournamentId);

      if (gs == null)
        return console.log("tournament not found");

      if (gs.tournamentStatus !== tournamentStatus.play)
        return;

      logger.info('Tournament %s is going to finish.', gs.tournamentId, { tag: gs.tournamentId });
      gs.tournamentStatus = tournamentStatus.latest;
    }
  }
});


// gamestate[tournaments_] contains the game information
// about the various tournaments
gamestate[tournaments_] = new Map();

exports = module.exports = gamestate;

const storage = require('./storage/storage');

const logger = require('./storage/logger');

const run = require('./utils/generator-runner').run;
const gameloop = require('./poker-engine/game-loop');

const playerStatus = require('./poker-engine/domain/player-status');
const createPlayer = require('./poker-engine/domain-utils/player-factory');

const tournamentStatus = require('./poker-engine/domain/tournament-status');
