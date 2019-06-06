'use strict';

module.exports = (sequalize, DataTypes) => {
    const Bracket = sequalize.define('Bracket', {
        divisions: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: null
        },
        tournamentId: {
            type: DataTypes.STRING,
            required: true
        },
        name: {
            type: DataTypes.STRING,
            required: true
        }
    });

    return Bracket
};
    //
    // let Bracket = mongoose.model('Bracket', BracketSchema);
    //
    // module.exports = {Bracket};
