const engine = require('../engine/index');
const app = require('../app');
const models = require('../models');
const Update = models.Update;
const Game = models.Game;

module.exports = {
    start: (table, bots) => {
        engine.start(table, bots);
    },

    join: (id, bots) => {
        engine.join(id, bots);
    },

    end: (id) => {
        engine.end(id);
    }
};

engine.on('tournament:aborted', () => {
    console.log('Tournament aborted.');
});

engine.on('tournament:completed', () => {
    console.log('Tournament completed.');
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
            app.io.sockets.in(data.tournamentId).emit('gameDataUpdated', {data: update});
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
            app.io.sockets.in(data.tournamentId).emit('gameOver', {data: game});
            done();
        })
        .catch((error) => {
            console.log(`An error occurred while saving ${data.type} updates.`);
            console.log(error);
            done();
        });
};
