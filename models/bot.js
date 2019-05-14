const mongoose = require('mongoose');

let BotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    serviceUrl: {
        type: String,
        required: true
    },
    tournaments: {
        type: [String],
        default: []
    },
    userId: {
        type: String,
        required: true
    },
    handsPlayed: {
        type: Number,
        default: 0
    },
    handsWon: {
      type: Number,
      default: 0
    },
    lastPlayed: {
        type: Date,
        default: null
    }
});

let Bot = mongoose.model('Bot', BotSchema);

module.exports = {Bot};
