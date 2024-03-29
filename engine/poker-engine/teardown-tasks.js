'use strict';

const playerStatus = require('./domain/player-status');
const gameStatus = require('./domain/tournament-status');

const logger = require('../storage/logger');
const storage = require('../storage/storage');

const showdown = require('./domain-utils/showdown');
const assignPot = require('./domain-utils/assign-pot');
const updatePlayersStatus = require('./domain-utils/update-players-status');

const engine = require('../index');
const constants = require('../../config/constants');


exports = module.exports = async function teardown(gs) {


  logger.info('Hand %d/%d, starting teardown ops', gs.gameProgressiveId, gs.handProgressiveId, { tag: gs.handUniqueId });


  const activePlayers = gs.activePlayers;

  logger.log('debug', 'Active players at the showdown: %s', activePlayers.map(p => `${p.name} (${p.id})`).toString().replace(/,/g, ', ').trim(), { tag: gs.handUniqueId });


  showdown(gs);

  logger.log('debug', getRankingLogMessage(gs.handChart), { tag: gs.handUniqueId });

  await storage.save({ type: 'showdown', handId: gs.handUniqueId, players: gs.players });


  assignPot(gs);

  if (gs.tableType !== 'sandbox') {
    for (let player of gs.winners) {
      await storage.updateBot({ id: player.id, handsWon: 1, isActive: true });
      //engine.emit('gamestate:update-bot', Object.assign({}, { id: player.id, handsWon: 1, isActive: true, totalWinnings: player.totalWinnings}));
      await storage.createMetric({
        metricType: constants.HAND_WON,
        value: 1,
        botId: player.id
      });
    }
    // engine.emit('gamestate:create-metric', Object.assign({}, {
    //   metricType: constants.HAND_WON,
    //   value: 1,
    //   botId: player.id
    // }));
  }

  logger.log('debug', getWinsLogMessage(gs.winners), { tag: gs.handUniqueId });

  await storage.save({ type: 'win', handId: gs.handUniqueId, winners: gs.winners, players: gs.players });

  for (let i = 0; i < gs.players.length; i++) {
    const player = gs.players[i];
    if (player.chips <= 0) {
      if (player.botType === 'userBot') {
        logger.info('%s (%s) is out', player.name, player.id, { tag: gs.handUniqueId });
        await storage.updateBot({ id: player.id, isActive: false, leaveTable: gs.tournamentId });
        await storage.endSession(player.sessionId);
        await storage.save({ type: 'status', handId: gs.handUniqueId, playerId: player.id, status: playerStatus.out, players: gs.players });
        if (gs.tableType !== 'sandbox') {
          await storage.createMetric({ metricType: constants.TOTAL_WINNINGS, value: (player.totalWinnings + player.chips), botId: player.id });
          gs.players.splice(i, 1);
        }
      } else if (gs.tableType === 'sandbox') {
        logger.info('%s (%s) is out', player.name, player.id, { tag: gs.handUniqueId });
      } else {
        player.chips += gs.config.MAX_BUYIN;
      }
    }
  }

  updatePlayersStatus(gs);


  if (gs.players < 3) {
    if (gs.tableType === 'sandbox')
      gs.tournamentStatus = gameStatus.stop;
    else
      gs.tournamentStatus = gameStatus.pause;
  }

  await storage.updateTable({ id: gs.tournamentId, numPlayers: gs.players.length });

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
