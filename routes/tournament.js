const engine = require('../engine/index');
const {Bot} = require('../models/bot');
const {Tournament} = require('../models/tournament');
const gameSchema = require('../models/game');
const updateSchema = require('../models/update');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const app = require('../app');
const ts = require('../config/tournamet-state');

router.post('/create', async (req, res) => {
    let newTournament = new Tournament(req.body);

    await newTournament.save().then((tournament, err) => {
        if (err) return res.status(400).send("Tournament Creation Error");
        res.status(200).send(`Tournament ${tournament._id} Created`);
    });
});

router.post('/start', async (req, res) => {
    Bot.find({tournaments: req.body.id}, (err, bots) => {
        if (err) return res.status(400).send("Tournament Start Error");
        res.status(200).send(`Tournament Started ${req.body.id}`);
        engine.start(req.body.id.toString(), bots);
    });
});

router.post('/quit', async (req, res) => {
    quitTournament(req.body.id);
});

router.get('/socket', async (rec, res) => {
    app.io.emit('gameDataUpdated', {data: 'data goes here'});
    res.send("emit");
});

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

const Update = mongoose.model('Update', updateSchema);

function saveUpdates(data, done) {
    [, data.tournamentId, data.gameId, data.handId] = data.handId.match(/^[\d]+_([a-z,-\d]+)_([\d]+)-([\d]+)$/i);
    let entry = new Update(data);
    entry.save((err, savedData) => {
        if (err) {
            console.log(`An error occurred while saving ${data.type} updates.`);
            console.log(err.message);
        }
        app.io.emit('gameDataUpdated', {data: savedData});
        done();
    });
}

const Game = mongoose.model('Game', gameSchema);

function saveGame(data, done) {
    let entry = new Game(data);
    entry.save((err, savedGame) => {
        if (err) {
            console.log(`An error occurred while saving ${data.type} updates.`);
            console.log(err.message);
        }
        if (savedGame.gameId === 1) {
            quitTournament(savedGame.tournamentId);
        }
        app.io.emit('gameOver', {data: savedGame});
        done();
    });
}

function quitTournament(id) {
    engine.quit(id);
    Bot.find({tournaments: id}, (err, bots) => {
        bots.forEach(bot => {
            bot.registered = false;
            Bot.findByIdAndUpdate(bot._id, bot, {new: true}, () => {
            });
        })
    });

    Tournament.findByIdAndUpdate(id, {$set: {state: ts.closed}}, {new: true}, (err, bot) => {

    });
}

module.exports = router;
