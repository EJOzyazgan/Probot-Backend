const express = require('express');
const router = express.Router();
const passport = require('passport');
const models = require('../models');
const Bot = models.Bot;
const Update = models.Update;
const User = models.User;
const moment = require('moment');
const Op = require('sequelize').Op;

router.get('/get/user', passport.authenticate('jwt', {session: false}), (req, res, next) => {
  Bot.findOne({
    where: {
      userId: req.user.dataValues.id
    }
  }).then((bot) => {
    return res.status(200).json(bot);
  }).catch((e) => {
    res.status(400).json({msg: 'Error finding bot', error: e});
  });
});

router.get('/get/admin', passport.authenticate('jwt', {session: false}), async (req, res) => {
  let admin = false;

  await User.findOne({
    where: {
      id: req.user.dataValues.id,
      isAdmin: true
    },
    attributes: ['id', 'isAdmin']
  }).then(user => {
    if (user) {
      admin = true;
    }
  }).catch(err => {
    return res.status(400).json({msg: 'Error validating admin', error: err});
  });

  if (admin) {
    Bot.findAll({
      where: {
        botType: {
          [Op.ne]: 'userBot'
        }
      }
    }).then(bots => {
      return res.status(200).send(bots);
    }).catch(err => {
      return res.status(400).json({msg: 'Error getting admin bots', error: err});
    })
  }

  return res.stats(200).json({msg: 'Not a valid admin'});
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
    tablesPlayed: req.body.tablesPlayed,
    botType: req.body.botType
  }, {
    where: {
      id: req.params.id
    },
    returning: true
  }).then(([rowsUpdate, [updatedBot]]) => {
    return res.status(200).json(updatedBot);
  }).catch((e) => {
    res.status(400).json({msg: 'Error updating bot', error: e});
  });
});

// router.post('/register', passport.authenticate('jwt', {session: false}), async (req, res) => {
//   Bot.findByIdAndUpdate(req.body.id, {
//     $addToSet: {
//       tournaments: {
//         tournamentId: req.body.tournamentId,
//         score: 0
//       }
//     }
//   }, {new: true}, (err, bot) => {
//     if (err) return res.status(400).send(err);
//     res.status(200).send("Bot Registered");
//   });
// });

router.post('/get/data', passport.authenticate('jwt', {session: false}), async (req, res) => {
  Update.findAll({
    where: {
      playerId: '' + req.body.botId,
      createdAt: {
        [Op.gte]: moment().subtract(req.body.timePeriod[2], req.body.timePeriod[1])
      },
    },
    attributes: {
      exclude: ['id', 'tournamentId', 'playerId', 'updatedAt', 'gameId', 'handId', 'sb',]
    }
  }).then(updates => {

    return res.status(200).send(cleanHistory(req.body.botId, updates));
  }).catch(err => {
    return res.status(400).json({msg: 'Error getting data', error: err});
  });
});

// router.post('/register/all', async (req, res) => {
//     await Bot.find({}, (err, bots) => {
//         bots.forEach(bot => {
//             Bot.findByIdAndUpdate(bot.id, {$addToSet: {tournaments: req.body.tournamentId}}, {new: true}, (err, bot) => {
//
//             });
//         });
//     });
// });
//
// router.get('/clear/tournaments', async (req, res) => {
//     await Bot.find({}, (err, bots) => {
//         bots.forEach(bot => {
//             bot.tournaments = [];
//             Bot.findByIdAndUpdate(bot.id, bot, {new: true}, () => {
//             });
//         });
//         if (err) return res.status(400).send("Bots Tournaments Cleared Error");
//         res.status(200).send("Bots Tournaments Cleared");
//     });
// });

function cleanHistory(id, history) {
  let cleanHistory = history;
  for (let update of cleanHistory) {
    if (Array.isArray(update.players))
      for (let player of update.players) {
        if (player.id !== id) {
          delete player.cards;
          delete player.name;
        }
        delete player.id;
        delete player.totalWinnings;
        delete player.willLeave;
        delete player.willJoin;
        delete player.bestCombination;
        delete player.bestCombinationData;
        delete player.hasDB;
      }
  }
  return cleanHistory;
}

module.exports = router;
