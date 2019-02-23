const mongoose = require('mongoose');

let BracketSchema = new mongoose.Schema({
    divisions: {
        type: [],
        default: null
    },
    tournamentId: {
        type: String,
        required: true
    }
});

let Bracket = mongoose.model('Bracket', BracketSchema);

module.exports = {Bracket};
