'use strict';

const playerStatus = require('../domain/player-status');
const tournamentStatus = require('../../poker-engine/domain/tournament-status');
const logger = require('../../storage/logger');
const engine = require('../../index');

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

  gs.players = gs.players.filter((player) => {
    return !player.willLeave
  });

  engine.emit('gamestate:update-table', Object.assign({}, {id: gs.tournamentId, numPlayers: gs.players.length}));

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

  if (gs.players.length < 2) {
    logger.info('Tournament %s waiting for more players players.', gs.tournamentId, {tag: gs.handUniqueId});
    gs.tournamentStatus = tournamentStatus.pause;
  } else {
    gs.tournamentStatus = tournamentStatus.play;
  }
};
