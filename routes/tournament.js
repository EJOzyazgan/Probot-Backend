const engine = require('../engine/index');
const {Bot} = require('../models/bot');
const {Bracket} = require('../models/bracket');
const {Tournament} = require('../models/tournament');
const {Game} = require('../models/game');
const {Update} = require('../models/update');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const app = require('../app');
const ts = require('../config/tournamet-state');

//PLAYERS
const testPlayer = require('../demo-players/test-player');

router.post('/create', async (req, res) => {
    let newTournament = new Tournament(req.body);

    await newTournament.save().then((tournament, err) => {
        if (err) return res.status(400).send("Tournament Creation Error");
        res.status(200).json({message: `Tournament ${tournament.name} Created`, tournament: tournament});
    });
});

router.get('/all', async (req, res) => {
    Tournament.find({}).then((tournaments, err) => {
        if (err) return res.status(400).send("Error retrieving tournaments");
        res.status(200).json({message: 'Tournaments received successfully', tournaments: tournaments});
    });
});

router.post('/start/game', async (req, res) => {
    const gameId = '' + req.body.division.name + req.body.round.name + req.body.game.name;
    engine.start('' + req.body.tournament._id + '-' + gameId, req.body.game.bots);
    return res.status(200).send('Game Started')
});

router.post('/bracket/create', async (req, res) => {
    // Bot.find({tournaments: req.body.id}, (err, bots) => {
    //     if (err) return res.status(400).send("Bracket Creation Error");
    // });

    let bracket = new Bracket(req.body);
    let numDivisions = 0;
    let bots = [];
    for (let i = 0; i < 100; i++)
        bots.push({name: `Bot ${i}`});

    for (let i = 6; i > 2; i--) {
        if (bots.length % i === 0) {
            numDivisions = i;
            break;
        }
    }

    for (let i = 0; i < numDivisions; i++) {
        let division = {name: i, rounds: [], winner: null};

        let finalRound = false;
        for (let x = 0; !finalRound; x++) {
            let round = {name: x, games: [], winners: []};

            let numGames = Math.floor(4 / (x + 1));
            if (numGames === 1) finalRound = true;

            for (let y = 0; y < numGames; y++) {
                let game = {name: y, bots: [], winners: []};

                if (x === 0) {
                    let numBots = bots.length / numDivisions / 4;
                    for (let k = numBots * (y); k < numBots * (y + 1); k++) {
                        game.bots.push({bot: bots[k], score: 0, status: 'play'});
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

router.post('/bracket/get/all', async (req, res) => {
    Bracket.find({tournamentId: req.body.tournamentId}, (err, brackets) => {
        if (err) return res.status(400).json({message: "Error Getting Brackets", error: err});
        res.status(200).send(brackets);
    })
});

router.post('/bracket/get/:id', async (req, res) => {
    Bracket.findById(req.body.bracketId, (err, bracket) => {
        if (err) return res.status(400).json({message: "Error Getting Bracket", error: err});
        res.status(200).send(bracket);
    })
});


router.post('/quit', async (req, res) => {
    quitTournament(req.body.id);
});

router.get('/socket', async (rec, res) => {
    app.io.emit('gameDataUpdated', {data: 'data goes here'});
    res.send("emit");
});

router.post('/bet', async  (req, res) => {
    res.status(200).send(testPlayer.bet(req.body).toString());
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
