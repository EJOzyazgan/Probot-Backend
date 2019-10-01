const engine = require('../engine/index');
const app = require('../app');
const moment = require('moment');
const models = require('../models');
const Update = models.Update;
const Game = models.Game;
const Table = models.Table;
const User = models.User;
const Bot = models.Bot;
const Metric = models.Metric;
const Session = models.Session;

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

engine.on('gamestate:end-session', (id) => {
  endSession(id);
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
  console.log('IN SAVE');
  Update.create(data)
    .then((update) => {
      app.io.sockets.in(data.tournamentId).emit('gameDataUpdated', { data: update });
      console.log('SAVED');
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


