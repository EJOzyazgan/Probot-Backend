const engine = require('../engine/index');
const {Bot} = require('../models/bot');
const {Bracket} = require('../models/bracket');
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

router.post('/bracket/create', async (req, res) => {
    // Bot.find({tournaments: req.body.id}, (err, bots) => {
    //     if (err) return res.status(400).send("Bracket Creation Error");
    // });

    let bracket = new Bracket({tournamentId: req.body.tournamentId});
    let numDivisions = 0;
    let bots = [];
    for(let i=0; i<req.body.num; i++)
        bots.push({name: `Bot ${i}`});

    for(let i = 6; i > 2; i--){
        if(bots.length % i === 0){
               numDivisions = i;
               break;
        }
    }

    let finalRound = false;
    for(let i = 0; i < numDivisions; i++){
        let division = {name: i, rounds: [], winner: null};

        for(let x = 0; !finalRound; x++){
            let round = {name: x, games: [], winners: []};

            let numGames = Math.floor(4/(x+1));
            if(numGames === 1) finalRound = true;

            for(let y = 0; y < numGames; y++){
                let game = {name: y, bots: [], winners: []};

                if(x === 0){
                    let numBots = bots.length/numDivisions/4;
                    for(let k = numBots*(y); k < numBots*(y+1); k++){
                        game.bots.push(bots[k]);
                    }
                }
                round.games.push(game);
            }
            division.rounds.push(round);
        }
        bracket.divisions.push(division);
    }


    await bracket.save((err, bracket) => {
        if (err) return res.status(400).send(err);
        res.status(200).json({message: "Bot Saved", bracket: bracket});
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