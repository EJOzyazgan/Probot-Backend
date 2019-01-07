const engine = require('poker-holdem-engine');
const {Bot} = require('../models/bot');
const {Tournament} = require('../models/tournament');
const gameSchema = require('../models/game');
const updateSchema = require('../models/update');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/start', async (req, res) => {
    let tournament = new Tournament({});

    await tournament.save().then(tournament => {
        Bot.find({registered: true}, (err, bots) => {
            bots.forEach((bot) => {
                bot.tournaments.push(tournament._id);
                console.log(bot);
                Bot.findByIdAndUpdate(bot._id, bot, {new: true},() => {});
            });

            if (err) return res.status(400).send("Tournament Start Error");
            res.status(200).send("Tournament Started");
            engine.start(tournament._id, bots);
        });
    });
});

router.post('/quit', async (req, res) => {
    await Bot.find({tournaments: req.body.id}, (err, bots) => {
        bots.forEach(bot => {
            Bot.update(bot._id, {registered: false});
        })
    });

    await Tournament.update(req.body.id, {onGoing: false}, (err) => {
        if (err) return res.status(400).send("Tournament Ended Error");
        res.status(200).send("Tournament Ended");
    });
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

function saveUpdates(data, done){
    [,data.tournamentId, data.gameId, data.handId] = data.handId.match(/^[\d]+_([a-z,-\d]+)_([\d]+)-([\d]+)$/i);
    let entry = new Update(data);
    entry.save((err, savedData) => {
        if(err){
            console.log(`An error occurred while saving ${data.type} updates.`);
            console.log(err.message);
        }
        done();
    });
}

const Game = mongoose.model('Game', gameSchema);

function saveGame(data, done){
    let entry = new Game(data);
    entry.save((err, savedData) => {
        if(err){
            console.log(`An error occurred while saving ${data.type} updates.`);
            console.log(err.message);
        }
        done();
    });
}

module.exports = router;