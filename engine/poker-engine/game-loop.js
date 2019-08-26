'use strict';

const logger = require('../storage/logger');
const save = require('../storage/storage').save;

const gameStatus = require('./domain/tournament-status');
const playerStatus = require('./domain/player-status');


const runSetupTasks = require('./setup-tasks');
const runTeardownTasks = require('./teardown-tasks');

const play = require('./bet-loop');

const engine = require('../index');
const constants = require('../../config/constants');


exports = module.exports = function* dealer(gs) {
  let config = gs.config;

  function sleep(time) {
    return new Promise(res => setTimeout(res, time));
  }

  function waitResume() {
    return new Promise(function (res, rej) {
      const time = setInterval(function () {
        if (gs.tournamentStatus === gameStatus.play) {
          res(clearInterval(time));
        }
      }, 5000);
    });
  }

  while (gs.tournamentStatus !== gameStatus.stop) {

    //
    // break here until the tournament is resumed
    if (gs.tournamentStatus === gameStatus.pause) {
      logger.info('Pause on hand %d/%d', gs.gameProgressiveId, gs.handProgressiveId, {tag: gs.handUniqueId});
      engine.emit('gamestate:update-table', Object.assign({}, {id: gs.tournamentId, numPlayers: gs.players.length}));
      yield waitResume();
    }

    const activePlayers = gs.activePlayers;
    const foldedPlayers = gs.players.filter(player => player.status === playerStatus.folded);

    if (gs.tableType !== 'sandbox') {
      gs.players.forEach(player => {
        engine.emit('gamestate:update-bot', Object.assign({}, {id: player.id, handsPlayed: 1, totalWinnings: (player.totalWinnings - player.chips)}));
        engine.emit('gamestate:create-metric', Object.assign({}, {
          metricType: constants.HAND_PLAYED,
          value: 1,
          botId: player.id
        }));
      });
    }

    // when before a new hand starts,
    // there is only one active player
    // the current game is finished.

    if (activePlayers.length + foldedPlayers.length === 1) {

      // each player takes points
      // on the basis of their rank...
      // then eventually a new game starts.

      // const playerCount = gs.gameChart.unshift(activePlayers[0].name);
      // const points = config.AWARDS[playerCount - 2];

      // const finalGameChart = gs.gameChart.map((playerName, i) => ({name: playerName, pts: points[i]}));

      // logger.info('Final ranks for game %d: %s', gs.gameProgressiveId, getRankingLogMessage(finalGameChart), {tag: gs.handUniqueId})

      // yield save({type: 'points', tournamentId: gs.tournamentId, gameId: gs.gameProgressiveId, rank: finalGameChart});


      // restore players' initial conditions
      gs.players.forEach(player => {
        player.status = playerStatus.active;
        player.chips = config.BUYIN;
      });
      gs.gameChart = null;

      if (gs.tournamentStatus === gameStatus.latest || gs.gameProgressiveId === config.MAX_GAMES) {
        gs.tournamentStatus = gameStatus.stop;
        continue;
      }

      // warm up
      if (config.WARMUP) {
        if (gs.gameProgressiveId <= config.WARMUP.GAME) {
          yield sleep(config.WARMUP.WAIT);
        }
      }

      // start a new game
      gs.handProgressiveId = 1;
      gs.gameProgressiveId++;
    }


    gs.handUniqueId = `${gs.pid}_${gs.tournamentId}_${gs.gameProgressiveId}-${gs.handProgressiveId}`;

    logger.info('Starting hand %d/%d', gs.gameProgressiveId, gs.handProgressiveId, {tag: gs.handUniqueId});


    if (gs.tournamentStatus === gameStatus.play || gs.tournamentStatus === gameStatus.latest) {

      if (config.HANDWAIT) {
        yield sleep(config.HANDWAIT);
      }

      // setup the hand:
      // restore the initial condition for a new hand, pot,
      // blinds, ante, cards ...

      runSetupTasks(gs);

      yield save({
        type: 'setup',
        handId: gs.handUniqueId,
        pot: gs.pot,
        sb: gs.sb,
        ante: gs.ante || 0,
        players: gs.players
      });


      // play the game
      // each player will be asked to make a bet,
      // until only one player remains active, or
      // the hand arrive to the "river" session

      yield* play(gs);


      // find the winner of the hand, eliminated players, ...
      // and updates accordingly the gamestate

      yield* runTeardownTasks(gs);

    }


    //
    // this is the gs.handProgressiveId° hand played
    // this info is important to compute the blinds level

    if (gs.tableType !== 'sandbox') {
      engine.emit('gamestate:create-metric', Object.assign({}, {metricType: constants.PLATFORM_HAND_PLAYED, value: 1}));
    }
    gs.handProgressiveId++;

  }

};


/**
 * @private
 * @function
 * @name getRankingLogMessage
 * @desc
 *  return a log of the final rankings
 *
 * @param {Array} players
 *  sorted list of the players, and points
 *
 * @returns {String}
 */
function getRankingLogMessage(ranking) {
  return ranking.reduce(function (msg, player) {
    return msg += `${player.name}: ${player.pts}, `, msg;
  }, '').trim().slice(0, -1);
}
