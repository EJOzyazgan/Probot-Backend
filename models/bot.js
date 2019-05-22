const mongoose = require('mongoose');
const Table = require('./table').schema;

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
    },
    currentTable: {
      type: String,
      default: null
    },
    tablesPlayed: {
        type: [Table],
        default: []
    }
});

let Bot = mongoose.model('Bot', BotSchema);

module.exports = {Bot};
