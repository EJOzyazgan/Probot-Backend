'use strict';

const ts = require('../config/tournamet-state');

module.exports = (sequalize, DataTypes) => {
    const Tournament = sequalize.define('Tournament', {
        state: {
            type: DataTypes.STRING,
            defaultValue: ts.registration
        },
        maxPlayers: {
            type: DataTypes.INTEGER,
            defaultValue: 100
        },
        name: {
            type: DataTypes.STRING,
            required: true
        }
    });

    return Tournament;
};

