const mongoose = require('mongoose');

let TableSchema = new mongoose.Schema({
    pot: {
        type: String,
        defaultValue: null
    }
});

let Table = mongoose.model('Table', TableSchema);

module.exports = {Table};