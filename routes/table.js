const engine = require('../engine/index');
const {Table} = require('../models/table');
const express = require('express');
const router = express.Router();
const passport = require('passport');

router.post('/create', passport.authenticate('jwt', {session: false}), async (req, res) => {
    Table.create(req.body)
        .then((table) => res.status(200).json(table))
        .catch((error) => {
            console.log(error);
            res.status(400).json({msg: 'Error creating table', error: error});
        });
});

router.post('/join', passport.authenticate('jwt', {session: false}), async (req, res) => {
    engine.join(req.body.id, req.body.bots);
    return res.status(200).json({message: 'Joined Match'})
});

module.exports = router;
