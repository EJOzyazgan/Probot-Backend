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
    registered: {
        type: Boolean,
        default: true
    }
});

let Bot = mongoose.model('Bot', BotSchema);

module.exports = {Bot};