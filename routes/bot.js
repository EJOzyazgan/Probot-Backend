const {Bot} = require('../models/bot');
const express = require('express');
const router = express.Router();

router.get('/:id', (req, res, next) => {
    res.send('get bot');
});

router.post('/create', async (req, res) => {
    let bot = new Bot(req.body);

    await bot.save((err, bot) => {
        if (err) return res.status(400).send(err);
        res.status(200).send("Bot Saved");
    });
});

router.post('/update', async (req, res) => {
    await Bot.findByIdAndUpdate(req.body.id, {
        $set: {
            name: req.body.name,
            serviceUrl: req.body.serviceUrl
        }
    }, {new: true}, (err, bot) => {
        if (err) return res.status(400).send("Bot Update Error");
        res.status(200).send("Bot Updated");
    });
});

router.post('/register', async (req, res) => {
    Bot.findByIdAndUpdate(req.body.id, {$addToSet: {tournaments: req.body.tournamentId}}, {new: true}, (err, bot) => {
        if (err) return res.status(400).send(err);
        res.status(200).send("Bot Registered");
    });
});

router.post('/register/all', async (req, res) => {
    await Bot.find({}, (err, bots) => {
        bots.forEach(bot => {
            Bot.findByIdAndUpdate(bot.id, {$addToSet: {tournaments: req.body.tournamentId}}, {new: true}, (err, bot) => {

            });
        });
    });
});

router.get('/clear/tournaments', async (req, res) => {
    await Bot.find({}, (err, bots) => {
        bots.forEach(bot => {
            bot.tournaments = [];
            Bot.findByIdAndUpdate(bot._id, bot, {new: true}, () => {
            });
        });
        if (err) return res.status(400).send("Bots Tournaments Cleared Error");
        res.status(200).send("Bots Tournaments Cleared");
    });
});

module.exports = router;
