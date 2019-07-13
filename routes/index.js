const express = require('express');
const router = express.Router();


const users = require('./users');
const tournament = require('./tournament');
const bot = require('./bot');
const table = require('./table');
const metric = require('./metric');

router.use('/tournament', tournament);
router.use('/user', users);
router.use('/bot', bot);
router.use('/table', table);
router.use('/metric', metric);

module.exports = router;
