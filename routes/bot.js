const express = require('express');
const router = express.Router();
const passport = require('passport');
const models = require('../models');
const Bot = models.Bot;

router.get('get/:id', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    Bot.findOne({
        where: {
            userId: req.params.id
        }
    }).then((bot) => {
        return res.status(200).json(bot);
    }).catch((e) => {
        res.status(400).json({msg: 'Error finding bot', error: e});
    });
});

router.post('/create', async (req, res) => {
   Bot.create(req.body)
        .then((bot) => res.status(200).json(bot))
        .catch((error) => {
            console.log(error);
            res.status(400).json({msg: 'Error creating bot', error: error});
        });
});

router.patch('/patch/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    Bot.update({
        name: req.body.name,
        serviceUrl: req.body.serviceUrl,
        tournaments: req.body.tournaments,
        handsPlayed: req.body.handsPlayed,
        handsWon: req.body.handsWon,
        lastPlayed: req.body.lastPlayed,
        currentTable: req.body.currentTable,
        tablesPlayed: req.body.tablesPlayed
    }, {
        where: {
            id: req.params.id
        },
        returning: true
    }).then(([ rowsUpdate, [updatedBot] ]) => {
        return res.status(200).json(updatedBot);
    }).catch((e) => {
        res.status(400).json({msg: 'Error updating bot', error: e});
    });
});

router.post('/register', passport.authenticate('jwt', {session: false}), async (req, res) => {
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
