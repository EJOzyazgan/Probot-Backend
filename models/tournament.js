const mongoose = require('mongoose');

let TournamentSchema = new mongoose.Schema({
    onGoing: {
        type: Boolean,
        default: true
    }
});

let Tournament = mongoose.model('Tournament', TournamentSchema);

module.exports = {Tournament};