const engine = require('../engine/index');
const {Bot} = require('../models/bot');
const {Bracket} = require('../models/bracket');
const {Tournament} = require('../models/tournament');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const app = require('../app');
const ts = require('../config/tournamet-state');
const models = require('../models');
const Update = models.Update;
const Game = models.Game;

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
    const gameId = '' + req.body.division.name + req.body.round.name + req.body.match.name;
    const tournamentId = '' + req.body.tournament._id + '-' + gameId;
    console.log(tournamentId);
    // console.log(getBots(req.body.match.bots));
    engine.start(tournamentId, req.body.match.bots);
    return res.status(200).json({message: 'Match Started'})
});

router.post('/bracket/create', async (req, res) => {
    let bracket = new Bracket(req.body);
    let numDivisions = 1;
    let bots = [];

    await Bot.find({}, (err, bot) => {
        if (err) return res.status(400).send("Bracket Creation Error");
        bots = bot
    });
    // for (let i = 0; i < 100; i++)
    //     bots.push({name: `Bot ${i}`});

    // for (let i = 6; i > 2; i--) {
    //     if (bots.length % i === 0) {
    //         numDivisions = i;
    //         break;
    //     }
    // }

    for (let i = 0; i < numDivisions; i++) {
        let division = {name: i, rounds: [], winner: null};

        let finalRound = false;
        for (let x = 0; !finalRound; x++) {
            let round = {name: x, matches: [], winners: []};

            let numGames = Math.floor(4 / (x + 1));
            if (numGames === 1) finalRound = true;

            for (let y = 0; y < numGames; y++) {
                let match = {name: y, bots: [], winners: []};

                if (x === 0) {
                    let numBots = bots.length / numDivisions / 4;
                    for (let k = numBots * (y); k < numBots * (y + 1); k++) {
                        match.bots.push({bot: bots[k], score: 0, status: 'play'});
                    }
                }
                round.matches.push(match);
            }
            division.rounds.push(round);
        }
        bracket.divisions.push(division);
    }

    await bracket.save((err, bracket) => {
        if (err) return res.status(400).send(err);
        res.status(200).json({message: "Bracket Saved", bracket: bracket});
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

router.post('/bracket/update', async (req, res) => {
    Bracket.findByIdAndUpdate(req.body._id, req.body, {new: true}, (err, bracket) => {
        console.log(bracket);
        res.status(200).json({message: "Bracket Updated", bracket: bracket});
    });
});


router.post('/quit', async (req, res) => {
    quitTournament(req.body.id);
});

router.post('/socket', async (req, res) => {
    console.log(req.body.room);
    app.io.sockets.in(req.body.room).emit('test', {data: `Hello room ${req.body.room}`});
    res.send("emit");
});

router.post('/bet', async (req, res) => {
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

function getBots(matchBots) {
    let bots = [];

    for (let bot of matchBots) {
        bot.bot.id = bot.bot._id;
        bots.push(bot.bot);
        console.log(bot.bot.id, bot.bot.id);
    }

    return bots;
}

function saveUpdates(data, done) {
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
}

function saveGame(data, done) {
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
}

function quitTournament(id) {
    engine.quit(id);
    Bot.find({tournaments: id}, (err, bots) => {
        bots.forEach(bot => {
            bot.registered = false;
            Bot.findByIdAndUpdate(bot.id, bot, {new: true}, () => {
            });
        })
    });

    Tournament.findByIdAndUpdate(id, {$set: {state: ts.closed}}, {new: true}, (err, bot) => {

    });
}

module.exports = router;
