const mongoose = require('mongoose');

let TableSchema = new mongoose.Schema({
    buyIn: {
        type: Number,
        default: 50
    }
});

let Table = mongoose.model('Table', TableSchema);

module.exports = {Table};
