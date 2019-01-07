// const mongoose = require('mongoose');
// const {Bot} = require('./bot');
//
// let GameSchema = new mongoose.Schema({
//     tournamentId: {
//         type: String,
//         required: true
//     },
//     rank: {
//         type: [Bot],
//         required: true
//     }
// });
//
// let Game = mongoose.model('Game', GameSchema);
//
// module.exports = {Game};

'use strict';

const mongoose = require('mongoose');

const player = new mongoose.Schema({
    name: String,
    pts: Number
});

exports = module.exports = new mongoose.Schema({
    tournamentId: String,
    gameId: Number,
    rank: [player]
});