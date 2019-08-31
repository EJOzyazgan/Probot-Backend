'use strict';

// let player = (sequalize, DataTypes) => {
//     return sequalize.define('Player', {
//         name: DataTypes.STRING,
//         pts: DataTypes.INTEGER
//     });
// };

module.exports = (sequalize, DataTypes) => {
    const Game = sequalize.define('Game', {
        tournamentId: DataTypes.STRING,
        gameId: DataTypes.INTEGER,
        rank: DataTypes.ARRAY(DataTypes.JSON)
    });

    return Game;
};
