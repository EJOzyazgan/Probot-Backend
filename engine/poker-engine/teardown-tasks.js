'use strict';

const playerStatus = require('./domain/player-status');
const gameStatus = require('./domain/tournament-status');

const logger = require('../storage/logger');
const save = require('../storage/storage').save;

const showdown = require('./domain-utils/showdown');
const assignPot = require('./domain-utils/assign-pot');
const updatePlayersStatus = require('./domain-utils/update-players-status');

const engine = require('../index');
const constants = require('../../config/constants');


exports = module.exports = function* teardown(gs) {


  logger.info('Hand %d/%d, starting teardown ops', gs.gameProgressiveId, gs.handProgressiveId, { tag: gs.handUniqueId });


  const activePlayers = gs.activePlayers;

  logger.log('debug', 'Active players at the showdown: %s', activePlayers.map(p => `${p.name} (${p.id})`).toString().replace(/,/g, ', ').trim(), { tag: gs.handUniqueId });


  showdown(gs);

  logger.log('debug', getRankingLogMessage(gs.handChart), { tag: gs.handUniqueId });

  yield save({ type: 'showdown', handId: gs.handUniqueId, players: gs.players });


  assignPot(gs);

  if (gs.tableType !== 'sandbox') {
    gs.winners.forEach(player => {
      engine.emit('gamestate:update-bot', Object.assign({}, { id: player.id, handsWon: 1, totalWinnings: (player.totalWinnings - player.chips) }));
      engine.emit('gamestate:create-metric', Object.assign({}, {
        metricType: constants.HAND_WON,
        value: 1,
        botId: player.id
      }));
    });
  }

  logger.log('debug', getWinsLogMessage(gs.winners), { tag: gs.handUniqueId });

  yield save({ type: 'win', handId: gs.handUniqueId, winners: gs.winners, players: gs.players });


  for (let i = 0; i < activePlayers.length; i++) {
    let player = activePlayers[i];
    if (player.chips === 0) {
      gs.players.splice(gs.players.findIndex(p => p.id === player.id));
      logger.info('%s (%s) is out', player.name, player.id, { tag: gs.handUniqueId });
      engine.emit('gamestate:update-bot', Object.assign({}, {id: player.id, isActive: false}));
      yield save({ type: 'status', handId: gs.handUniqueId, playerId: player.id, status: playerStatus.out });
    }
  }

  updatePlayersStatus(gs);

  if (gs.activePlayers < 2) {
    if (gs.tableType === 'sandbox')
      gs.tournamentStatus = gameStatus.stop;
    else
      gs.tournamentStatus = gameStatus.pause;
  }


  gs.handChart = gs.winners = null;

};


/**
 * @private
 * @function
 * @name getRankingLogMessage
 * @desc
 *  return a log of the player ranks in the current hand
 *
 * @param {Array} ranks
 *  sorted list of players
 *
 * @returns {String}
 */
function getRankingLogMessage(chart) {
  let rank = 0;
  return chart.reduce(function (msg, curr) {
    rank++;
    return msg += `${rank} - ${curr.name} (${curr.id}), `, msg;
  }, '').trim().slice(0, -1);
}


/**
 * @private
 * @function
 * @name getWinsLogMessage
 * @desc
 *  return a log about the player(s) who have won chips in the current hand.
 *
 * @param {Array} winners
 *  list of players
 *
 * @returns {String}
 */
function getWinsLogMessage(winners) {
  return winners.reduce(function (msg, winner) {
    return msg += `${winner.name} (${winner.id}) wins ${winner.amount}, `, msg;
  }, '').trim().slice(0, -1);
}
