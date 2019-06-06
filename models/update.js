'use strict';

let card = (sequalize, DataTypes) => {
    return sequalize.define('Card', {
        rank: {type: DataTypes.STRING, required: true},
        type: {type: DataTypes.STRING, required: true}
    });
};

let player = (sequalize, DataTypes) => {
    return sequalize.define('Player', {
        name: {type: DataTypes.STRING, required: true},
        id: {type: DataTypes.STRING, required: true},
        hasDB: DataTypes.BOOLEAN,
        isAllin: DataTypes.BOOLEAN,
        chipsBet: DataTypes.INTEGER,
        chips: DataTypes.INTEGER,
        cards: DataTypes.ARRAY(DataTypes.JSON),
        bestCards: DataTypes.ARRAY(DataTypes.JSON),
        point: DataTypes.STRING,
        status: DataTypes.STRING
    });
};

let winner = (sequalize, DataTypes) => {
    return sequalize.define('Winner', {
        id: {type: DataTypes.STRING, required: true},
        amount: {type: DataTypes.INTEGER, required: true}
    });
};

module.exports = (sequalize, DataTypes) => {
    return sequalize.define('Update', {
        tournamentId: {type: DataTypes.STRING, required: true},
        gameId: {type: DataTypes.INTEGER, required: true},
        handId: {type: DataTypes.INTEGER, required: true},
        type: {type: DataTypes.STRING, required: true, enum: ['setup', 'bet', 'cards', 'status', 'showdown', 'win']},
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
};
//
// let Update = mongoose.model('Update', UpdateSchema);
//
// module.exports = {Update};
