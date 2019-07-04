const engine = require('../controllers/engine');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const models = require('../models');
const Table = models.Table;
const Bot = models.Bot;

router.post('/create', passport.authenticate('jwt', {session: false}), async (req, res) => {
  Table.create(req.body)
    .then(table => res.status(200).json(table))
    .catch(err => {
      console.log(err);
      return res.status(400).json({msg: 'Error creating table', error: err});
    });
});

router.post('/start/new/:id', passport.authenticate('jwt', {session: false}), async (req, res) => {
  Table.findOne({
    where: {
      id: req.params.id
    }
  }).then(table => {
    if(!table) {
      return res.status(400).json({msg: 'Table does not exist'});
    }
    engine.start(table, req.body.bots);
    return res.status(200).json({msg: 'Table Started'});
  }).catch(e => {
    return res.status(400).json({msg: 'Error finding table', error: e});
  });
});

router.post('/start/sandbox', passport.authenticate('jwt', {session: false}), async (req, res) => {
  Table.findOrCreate({
    where: {
      tableType: 'sandbox',
      active: false,
      'config.MAX_GAMES': req.body.numGames
    }
  }).then(async ([table, created]) => {
    Bot.findAll({
      where: {
        isSandboxBot: true
      }
    }).then(bots => {
      bots.push(req.body.bot);
      engine.start(table, bots);
      return res.status(200).json({msg: 'Sandbox Table Started'});
    }).catch(err => {
      return res.status(400).json({msg: 'Error finding bots', error: err});
    });
  }).catch(err => {
    return res.status(400).json({msg: 'Error finding table', error: err});
  });
});

router.post('/join', passport.authenticate('jwt', {session: false}), async (req, res) => {
  engine.join(req.body.id, req.body.bots);
  return res.status(200).json({message: 'Joined Match'})
});

createSandBox = async () => {
  Table.create({
    type: 'sandbox'
  }).then(table => {
    return {success: true, obj: table}
  }).catch(err => {
    return {success: false, obj: err};
  });
};

module.exports = router;
