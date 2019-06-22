'use strict';

module.exports = (sequalize, DataTypes) => {
    const Table = sequalize.define('Table', {
        buyIn: {
            type: DataTypes.INTEGER,
            defaultValue: 50
        }
    });

    return Table
};

