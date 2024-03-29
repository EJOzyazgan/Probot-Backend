const logger = require('./logger');

const engine = require('../index');

const moment = require('moment');

const models = require('../../models');
const Update = models.Update;
const Game = models.Game;
const Table = models.Table;
const User = models.User;
const Bot = models.Bot;
const Metric = models.Metric;
const Session = models.Session;
const SessionUpdates = models.SessionUpdates;

module.exports = {
  save,
  updateBot,
  updateTable,
  updateUser,
  createMetric,
  endSession,
  deleteSession,
}

async function save(updates) {

  if (Array.isArray(updates.players)) {
    const hasDB = Symbol.for('has-dealer-button');
    const isAllin = Symbol.for('is-all-in');
    updates.players = updates.players.map(function (p, i) {
      const player = Object.assign({}, p);
      player.id = p.id;
      player.name = p.name;
      player.hasDB = p[hasDB];
      player.isAllin = p[isAllin];
      return player;
    });
  }


  //
  // the promise is pending until
  // a watchers save the gamestate updates, and resolve
  // return new Promise(function (resolve) {
  //   return engine.emit('gamestate:updated', Object.assign({}, updates), resolve);
  // });
  if (updates.type !== 'points')
    return saveUpdates(updates);
  return saveGame(updates);
}

async function saveUpdates(data) {
  [, data.tournamentId, data.gameId, data.handId] = data.handId.match(/^[\d]+_([a-z,-\d]+)_([\d]+)-([\d]+)$/i);

  const update = await Update.create(data);

  for (let player of data.players) {
    if (player.botType === 'userBot') {
      await createSessionUpdate(update.id, player.sessionId);
    }
  }


  // if (update) {
  //   app.io.sockets.in(data.tournamentId).emit('gameDataUpdated', { data: update });
  // } else {
  //   logger.log('debug', 'Update not created');
  // }
};

async function saveGame(data) {
  const game = await Game.create(data);
  // await createSessionUpdate(game.id, data.players);
  // if (game) {
  //   app.io.sockets.in(data.tournamentId).emit('gameOver', { data: game });
  // } else {
  //   logger.log('debug', 'Game update not created');
  // }
};

async function createSessionUpdate(updateId, sessionId) {
  const session = await Session.findOne({
    where: {
      id: sessionId,
    },
  })

  if (session) {
    await SessionUpdates.create({
      sessionId,
      updateId,
    });
  }
}

async function updateTable(data) {
  const table = await Table.findOne({
    where: {
      id: data.id,
    },
  });

  if (table) {
    table.numPlayers = data.numPlayers;
    table.isActive = data.numPlayers > 2;
  } else {
    logger.log('debug', 'No table found with id: %s', data.id);
  }

  await table.save();
}

async function updateUser(data) {
  const user = await User.findOne({
    where: {
      id: data.id
    }
  });

  if (user) {
    if (data.chips) {
      user.chips += data.chips;
    }
  } else {
    logger.log('debug', 'No user found with id: %s', data.id);
    resolve(true);
  }

  await user.save();
}

async function updateBot(data) {
  const bot = await Bot.findOne({
    where: {
      id: data.id,
    },
  });

  if (data.joinTable)
    bot.currentTables.push(data.joinTable);
  else if (data.leaveTable)
    bot.currentTables.splice(bot.currentTables.indexOf(data.leaveTable), 1);

  await bot.update({
    handsPlayed: data.handsPlayed ? bot.handsPlayed += data.handsPlayed : bot.handsPlayed,
    handsWon: data.handsWon ? bot.handsWon += data.handsWon : bot.handsWon,
    totalWinnings: data.totalWinnings ? data.totalWinnings : bot.totalWinnings,
    isActive: data.isActive !== undefined && data.isActive !== null ? data.isActive : bot.isActive,
    currentTables: bot.currentTables,
  });
}

async function createMetric(data) {
  await Metric.create(data);
}

async function endSession(id) {
  if (id) {
    const session = await Session.findOne({
      where: {
        id,
      },
    });

    if (session) {
      session.endedAt = moment().format();
    } else {
      logger.log('debug', "No Session found with id: %s", id);

    }

    await session.save();
  }
}

async function deleteSession(id) {
  if (id) {
    await Session.destroy({
      where: {
        id,
      },
    });
  }
}
