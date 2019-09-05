const engine = require('../controllers/engine');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const models = require('../models');
const Table = models.Table;
const Bot = models.Bot;

router.post('/create', passport.authenticate('jwt', { session: false }), async (req, res) => {
  Table.create(req.body)
    .then(table => res.status(200).json(table))
    .catch(err => {
      console.log(err);
      return res.status(400).json({ msg: 'Error creating table', error: err });
    });
});

router.post('/start/new/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  Table.findOne({
    where: {
      id: req.params.id
    }
  }).then(table => {
    if (!table) {
      return res.status(400).json({ msg: 'Table does not exist' });
    }
    engine.start(table, req.body.bots);
    return res.status(200).json({ msg: 'Table Started' });
  }).catch(e => {
    return res.status(400).json({ msg: 'Error finding table', error: e });
  });
});

router.post('/start/sandbox', passport.authenticate('jwt', { session: false }), async (req, res) => {
  Table.findOrCreate({
    where: {
      tableType: 'sandbox',
      isActive: false,
      'config.MAX_GAMES': 1
    }
  }).then(async ([table, created]) => {
    Bot.findAll({
      where: {
        botType: 'sandbox',
      },
      limit: 4,
    }).then(async bots => {
      bots.push(req.body);
      req.body.isActive = true;
      await Bot.update(req.body, {
        where: {
          id: req.body.id,
        },
      });
      engine.start(table, bots, req.body);

      return res.status(200).json({ msg: 'Sandbox Table Started' });
    }).catch(err => {
      console.log(err);
      return res.status(400).json({ msg: 'Error finding bots', error: err });
    });
  }).catch(err => {
    return res.status(400).json({ msg: 'Error finding table', error: err });
  });
});

router.patch('/update', passport.authenticate('jwt', { session: false }), async (req, res) => {
  let json = await updateTable(req.body);
  return res.status(200).json(json);
});

router.post('/join', passport.authenticate('jwt', { session: false }), async (req, res) => {
  Table.findAll({
    limit: 5,
    where: {
      'config.SMALL_BLIND': req.body.table.smallBlind,
      'config.MIN_BUYIN': req.body.table.minBuyin,
      'config.MAX_BUYIN': req.body.table.maxBuyin,
      tableType: 'pvp',
    },
    order: [
      ['numPlayers', 'ASC']
    ]
  }).then(async tables => {
    req.body.bot.buyin = req.body.buyin;
    for (let i = 1; i < 6; i++) {
      for (let table of tables) {
        if (table.numPlayers === i) {
          engine.join(table.id, [req.body.bot]);
          return res.status(200).json({ msg: 'Joined Table' });
        }
      }

      if (tables.length === 0) {
        return await openNewTable(res, req);
      } else if (i === 5 && tables[0].numPlayers === 0) {
        engine.join(tables[0].id, [req.body.bot]);
        return res.status(200).json({ msg: 'Waiting for other players' });
      } else if (i === 5) {
        return await openNewTable(res, req);
      }
    }
  }).catch(err => {
    console.log(err, 'join');
    return res.status(400).json({ msg: 'Could not join table', error: err });
  });
});

updateTable = (table) => {
  return Table.update(table, {
    where: {
      id: table.id
    },
    returning: true
  }).then(([rowsUpdate, [updatedTable]]) => {
    return { success: true, obj: updatedTable };
  }).catch((err) => {
    return { success: false, obj: err };
  });
};

openNewTable = (res, req) => {
  return Table.create({
    tableType: 'pvp',
    numPlayers: 1,
    'config.SMALL_BLIND': req.body.table.smallBlind,
    'config.MIN_BUYIN': req.body.table.minBuyin,
    'config.MAX_BUYIN': req.body.table.maxBuyin,
  }).then(table => {
    Bot.findAll({
      where: {
        botType: 'pvp',
      },
      limit: 2,
    }).then(sysbots => {
      sysbots.push(req.body.bot);
      engine.start(table.dataValues, sysbots);
      return res.status(200).json({ msg: 'Joined Table' });
    })
  }).catch(err => {
    console.log(err);
    return res.status(400).json({ msg: 'Could not join table', error: err })
  })
};

module.exports = router;
