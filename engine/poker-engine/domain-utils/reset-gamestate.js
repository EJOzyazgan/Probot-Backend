'use strict';

const playerStatus = require('../domain/player-status');
const tournamentStatus = require('../../poker-engine/domain/tournament-status');
const logger = require('../../storage/logger');
const engine = require('../../index');
const constants = require('../../../config/constants');
const storage = require('../../storage/storage');

/**
 * @function
 * @name resetGamestate
 * @desc reset the gamestate to the initial conditions
 *
 * @param {Object} gs:
 *  the gamestate object
 *
 * @returns void
 */
exports = module.exports = async function resetGamestate(gs) {

  gs.pot = gs.callAmount = 0;

  gs.sidepots = [];
  gs.commonCards = [];


  const allin_ = Symbol.for('is-all-in');
  const hasBB_ = Symbol.for('has-big-blind');

  gs.players = gs.players.filter(async (player, i) => {
    if (player.willLeave && gs.tableType !== 'sandbox' && player.botType === 'userBot') {
      player.totalWinnings += player.chips;
      await storage.updateBot({ id: player.id, totalWinnings: (player.totalWinnings + player.chips), isActive: false });
      //engine.emit('gamestate:update-bot', Object.assign({}, { id: player.id, totalWinnings: player.totalWinnings, isActive: false }));
      await storage.updateUser({ id: player.userId, chips: player.chips });
      //engine.emit('gamestate:update-user', Object.assign({}, { id: player.userId, chips: player.chips }));
      await storage.createMetric({ metricType: constants.TOTAL_WINNINGS, value: (player.totalWinnings + player.chips), botId: player.id });
      //engine.emit('gamestate:create-metric', Object.assign({}, { metricType: constants.TOTAL_WINNINGS, value: player.totalWinnings, botId: player.id }));
      await storage.endSession(player.sessionId);
      //engine.emit('gamestate:end-session', player.sessionId);
      gs.players.splice(i, 1);
      return false;
    }
    return true;
  });

  gs.players.forEach(function (player) {

    [hasBB_, allin_].forEach(function (symb) {
      delete player[symb];
    });

    // players who have folded in the previous hand
    // should be re-activated
    if (player.status === playerStatus.folded) {
      player.status = playerStatus.active;
    } else if (player.willJoin) {
      player.willJoin = false;
    }

    player.chipsBet = 0;

    player.cards = [];
    player.bestCombination = [];
    player.bestCombinationData = null;

  });

  if (gs.players.length < 3) {
    logger.info('Tournament %s waiting for more players players.', gs.tournamentId, { tag: gs.handUniqueId });
    gs.tournamentStatus = tournamentStatus.pause;
  } else {
    gs.tournamentStatus = tournamentStatus.play;
  }

  await storage.updateTable({ id: gs.tournamentId, numPlayers: gs.players.length });
  //engine.emit('gamestate:update-table', Object.assign({}, { id: gs.tournamentId, numPlayers: gs.players.length }));
};
