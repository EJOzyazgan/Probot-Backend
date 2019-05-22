const engine = require('../engine/index');
const {Table} = require('../models/table');
const {Game} = require('../models/game');
const {Update} = require('../models/update');
const express = require('express');
const router = express.Router();
const app = require('../app');


router.post('/create', async (req, res) => {
   let newTable = new Table({buyin: req.body.buyIn});

    await newTable.save().then((table, err) => {
        if (err) return res.status(400).send("Table Creation Error");
        res.status(200).json({message: `Table BuyIn: ${table.buyIn} Created`, table: table});
    });
});

router.post('/join', async (req, res) => {
    engine.join(req.body.id, req.body.bots);
    return res.status(200).json({message: 'Joined Match'})
});



module.exports = router;
