const {Bot} = require('../models/bot');
const express = require('express');
const router = express.Router();

router.get('/:id', (req, res, next) => {
    res.send('get bot');
});

router.post('/create', async (req, res) => {
    let bot = new Bot({
        name: req.body.name,
        serviceUrl: req.body.serviceUrl
    });

    await bot.save((err, bot) => {
        if (err) return res.status(400).send(err);
        res.status(200).send("Bot Saved");
    });
});

router.post('/update', async (req, res) => {
    await Bot.update(req.body.id, {$set: {name: req.body.name, serviceUrl: req.body.serviceUrl}}, (err, bot) => {
        if (err) return res.status(400).send("Bot Update Error");
        res.status(200).send("Bot Updated");
    });
});

module.exports = router;