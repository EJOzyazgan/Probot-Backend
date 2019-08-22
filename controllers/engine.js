const engine = require('../engine/index');
const app = require('../app');
const models = require('../models');
const Update = models.Update;
const Game = models.Game;
const Table = models.Table;
const User = models.User;
const Bot = models.Bot;
const Metric = models.Metric;

module.exports = {
  start: (table, bots, mainBot) => {
    engine.start(table, bots, mainBot);
  },

  join: (id, bots) => {
    engine.join(id, bots);
  },

  end: (id) => {
    engine.end(id);
  },
};

engine.on('tournament:aborted', () => {
  console.log('Tournament aborted.');
});

engine.on('tournament:completed', () => {
  console.log('Tournament completed.');
});

engine.on('gamestate:update-bot', (data) => {
  updateBot(data);
});

engine.on('gamestate:update-table', (data) => {
  updateTable(data);
});

engine.on('gamestate:update-user', (data) => {
  updateUser(data);
});

engine.on('gamestate:create-metric', (data) => {
  createMetric(data);
});

engine.on('sandbox:update', data => {
  app.io.sockets.in(`${data.id}-sandbox`).emit('sandboxUpdate', data);
});

engine.on('gamestate:updated', (data, done) => {
  if (data.type !== 'points')
    return void saveUpdates(data, done);
  saveGame(data, done);
});

let saveUpdates = (data, done) => {
  [, data.tournamentId, data.gameId, data.handId] = data.handId.match(/^[\d]+_([a-z,-\d]+)_([\d]+)-([\d]+)$/i);
  // let entry = new Update(data);
  // console.log(data);
  Update.create(data)
    .then((update) => {
      app.io.sockets.in(data.tournamentId).emit('gameDataUpdated', { data: update });
      done();
    })
    .catch((error) => {
      console.log(`An error occurred while saving ${data.type} updates.`);
      console.log(error);
      done();
    });
};

let saveGame = (data, done) => {
  Game.create(data)
    .then((game) => {
      app.io.sockets.in(data.tournamentId).emit('gameOver', { data: game });
      done();
    })
    .catch((error) => {
      console.log(`An error occurred while saving ${data.type} updates.`);
      console.log(error);
      done();
    });
};

let updateTable = (data) => {
  Table.update({
    numPlayers: data.numPlayers,
    isActive: data.numPlayers > 1
  }, {
      where: {
        id: data.id
      }
    }).then(() => {

    }).catch((err) => {
      console.log(err);
    });
};

let updateUser = (data) => {
  User.findOne({
    where: {
      id: data.id
    }
  }).then((user) => {
    if (data.chips) {
      user.chips += data.chips;
    }

    User.update({
      chips: user.chips,
      totalWinnings: user.totalWinnings
    }, {
        where: {
          id: user.id
        }
      }).then(() => {

      }).catch((err) => {
        console.log(err);
      });
  }).catch((err) => {
    console.log(err);
  });
};

let updateBot = (data) => {
  Bot.findOne({
    where: {
      id: data.id
    }
  }).then(bot => {
    if (data.handsPlayed)
      bot.handsPlayed += data.handsPlayed;
    if (data.handsWon)
      bot.handsWon += data.handsWon;
    if (data.totalWinnings)
      bot.totalWinnings = data.totalWinnings;
    if (data.isActive !== null && data.isActive !== undefined)
      bot.isActive = data.isActive;

    Bot.update({
      handsPlayed: bot.handsPlayed,
      handsWon: bot.handsWon,
      totalWinnings: bot.totalWinnings,
      isActive: bot.isActive,
    }, {
        where: {
          id: bot.id
        }
      }).then(() => {

      }).catch((err) => {
        console.log(err);
      });
  }).catch((err) => {
    console.log(err);
  });
};

let createMetric = (data) => {
  Metric.create(data);
};
