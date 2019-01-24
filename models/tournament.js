const mongoose = require('mongoose');
const ts = require('../config/tournamet-state');

let TournamentSchema = new mongoose.Schema({
    state: {
        type: String,
        default: ts.registration
    },
    maxPlayers: {
        type: Number,
        default: 100
    },
    name: {
        type: String,
        required: true
    }
});

let Tournament = mongoose.model('Tournament', TournamentSchema);

module.exports = {Tournament};
