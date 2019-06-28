const engine = require('../controllers/engine');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const models = require('../models');
const Table = models.Table;

router.post('/create', passport.authenticate('jwt', {session: false}), async (req, res) => {
  Table.create(req.body)
    .then((table) => res.status(200).json(table))
    .catch((error) => {
      console.log(error);
      res.status(400).json({msg: 'Error creating table', error: error});
    });
});

router.post('/start/:id', passport.authenticate('jwt', {session: false}), async (req, res) => {
  console.log(req.params);
  Table.findOne({
    where: {
      id: req.params.id
    }
  }).then((table) => {
    engine.start(table, req.body.bots);
    return res.status(200).json({msg: 'Table Started'});
  }).catch((e) => {
    res.status(400).json({msg: 'Error finding table', error: e});
  });
});

router.post('/join', passport.authenticate('jwt', {session: false}), async (req, res) => {
  engine.join(req.body.id, req.body.bots);
  return res.status(200).json({message: 'Joined Match'})
});

module.exports = router;
