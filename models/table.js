'use strict';

module.exports = (sequalize, DataTypes) => {
  const Table = sequalize.define('Table', {
    tableType: {
      type: DataTypes.STRING,
      defaultValue: 'sandbox'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    numPlayers: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    config: {
      type: DataTypes.JSON,
      defaultValue: { // configure the logger level;
        // one between { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
        LOG_LEVEL: 'debug',

        // time (expressed in ms) to wait after an hand ends,
        // before a new one can start
        HANDWAIT: 100,

        // time (expressed in ms) to wait after a bet,
        // before a new one can start
        BETWAIT: 100,

        // define the warm up phase of the tournament.
        // for the first WARMUP.GAME games of the tournament,
        // when a game ends, the engine will wait WARMUP.WAIT ms
        // before a new game starts.
        WARMUP: {
          GAME: 0,
          WAIT: 10 * 1000
        },

        // define the max number of different game after which a tournament
        // automatically finishes
        MAX_GAMES: Infinity,

        // the amount of initial chips for each player
        MIN_BUYIN: 100,
        MAX_BUYIN: 400,

        // the progression of small blinds
        SMALL_BLINDS: [5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 500, 750, 1000, 1500, 2000],

        SMALL_BLIND: 30,

        // duration of a small blind value,
        // expressed in terms of "DB turns of the table"
        BLINDS_PERIOD: 1,

        // antes are a set amount put in the pot by every player in the game
        // prior to cards being dealt.
        // ante amount is always 10% of bigblind;
        // if enabled, antes should be started being payed
        // when 10% of bigblind amount is greater equal than
        // 10% of the initial buy-in.
        ENABLE_ANTE: false,

        // points the players receive on the basis of their placement in a game;
        // the value of a placement changes in function of the number of players
        AWARDS: [
          [1, 0],
          [2, 1, 0],
          [3, 2, 1, 0],
          [4, 3, 2, 1, 0],
          [5, 2, 0, 2, 1, 0],
          [6, 5, 4, 3, 2, 1, 0],
          [7, 6, 5, 4, 3, 2, 1, 0]
        ]
      }
    }
  });

  return Table
};

