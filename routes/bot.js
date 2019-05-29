const {Bot} = require('../models/bot');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/:id', auth.required, (req, res, next) => {
    Bot.findOne({userId: req.params.id}, (err, bot) => {
        if (err) return res.status(400).json({message: "Error retrieving bot", error: err});
        res.status(200).json(bot);
    });
});

router.post('/create', async (req, res) => {
    let bot = new Bot(req.body);

    await bot.save((err, bot) => {
        if (err) return res.status(400).send(err);
        res.status(200).json(bot);
    });
});

router.patch('/patch', auth.required, (req, res) => {
    console.log(req.body);
    Bot.findOneAndUpdate({_id: req.body._id}, req.body, {new: true}).then((bot, err) => {
        if (err)
            return res.status(400).json({message: "Couldn't Patch Bot", error: err});
        return res.status(200).json(bot);
    });
});

router.post('/register', auth.required, async (req, res) => {
    Bot.findByIdAndUpdate(req.body.id, {
        $addToSet: {
            tournaments: {
                tournamentId: req.body.tournamentId,
                score: 0
            }
        }
    }, {new: true}, (err, bot) => {
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
            Bot.findByIdAndUpdate(bot.id, bot, {new: true}, () => {
            });
        });
        if (err) return res.status(400).send("Bots Tournaments Cleared Error");
        res.status(200).send("Bots Tournaments Cleared");
    });
});

module.exports = router;
