'use strict';

module.exports = (sequalize, DataTypes) => {
    const Update = sequalize.define('Update', {
        tournamentId: {type: DataTypes.INTEGER, allowNull: false},
        gameId: {type: DataTypes.INTEGER, allowNull: false},
        handId: {type: DataTypes.INTEGER, allowNull: false},
        type: {type: DataTypes.STRING, allowNull: false, enum: ['setup', 'bet', 'cards', 'status', 'showdown', 'win']},
        pot: DataTypes.DOUBLE,
        sb: DataTypes.DOUBLE,
        players: DataTypes.ARRAY(DataTypes.JSON),
        session: {type: DataTypes.STRING, enum: ['pre-flop', 'flop', 'turn', 'river']},
        commonCards: DataTypes.ARRAY(DataTypes.JSON),
        playerId: DataTypes.INTEGER,
        amount: DataTypes.DOUBLE,
        status: {type: DataTypes.STRING, enum: ['folded', 'out']},
        winners: DataTypes.ARRAY(DataTypes.JSON),
        playerName: DataTypes.STRING
    });

    return Update;
};

