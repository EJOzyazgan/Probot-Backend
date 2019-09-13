'use strict';

module.exports = (sequalize, DataTypes) => {
    const Update = sequalize.define('Update', {
        tournamentId: {type: DataTypes.STRING, allowNull: false},
        gameId: {type: DataTypes.INTEGER, allowNull: false},
        handId: {type: DataTypes.INTEGER, allowNull: false},
        type: {type: DataTypes.STRING, allowNull: false, enum: ['setup', 'bet', 'cards', 'status', 'showdown', 'win']},
        pot: DataTypes.INTEGER,
        sb: DataTypes.INTEGER,
        players: DataTypes.ARRAY(DataTypes.JSON),
        session: {type: DataTypes.STRING, enum: ['pre-flop', 'flop', 'turn', 'river']},
        commonCards: DataTypes.ARRAY(DataTypes.JSON),
        playerId: DataTypes.STRING,
        amount: DataTypes.INTEGER,
        status: {type: DataTypes.STRING, enum: ['folded', 'out']},
        winners: DataTypes.ARRAY(DataTypes.JSON),
        playerName: DataTypes.STRING
    });

    return Update;
};

