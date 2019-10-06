'use strict';
const logger = require('../../storage/logger');
const storage = require('../../storage/storage');

const request = require('request');
const sortByRank = require('poker-rank');
const getCombinations = require('poker-combinations');


const playerStatus = require('../domain/player-status');
const gameStatus = require('../domain/tournament-status');

const splitPot = require('./split-pot');

const models = require('../../../models');
const Update = models.Update;


const update_ = Symbol('internal-update-method');
const engine = require('../../index');

const actions = {

  /**
   * @function
   * @name Symbol('internal-update-method')
   * @desc
   *  Update the gamestate, and the player chips
   *  of his last bet.
   *
   * @param {Object} gs:
   *  the gamestate object
   *
   * @param {Number} betAmount
   *  the amount of chips the player has bet
   *
   * @returns {void}
   */
  [update_](gs, betAmount) {

    const isAllin_ = Symbol.for('is-all-in');

    this[isAllin_] = betAmount === this.chips;


    // update chip values
    // for the player, and on the gamestate
    this.chipsBet += betAmount;
    this.chips -= betAmount;

    gs.pot += betAmount;

    if (this[isAllin_] || gs.sidepots.length > 0 || gs.players.find(x => x[isAllin_]) != null) {
      splitPot(gs);
    }

    gs.callAmount = Math.max(this.chipsBet, gs.callAmount);

  },


  /**
   * @function
   * @name payBet
   * @desc
   *  Validate, and eventually normalize the bet amount
   *  in order to assure that poker hold'em rules are respected,
   *  then updates the gamestate.
   *
   * @param {Object} gs:
   *  the gamestate object
   * @param {Number} betAmount
   *  the amount of chips the player has to pay
   *
   * @returns {Promise} a promise resolved when bet data is stored
   */
  async payBet(gs, betAmount) {
    if (betAmount < 0 && !this.willLeave) {
      this.leave(gs);
    }

    if (this.willJoin) {
      this.status = playerStatus.join;

      logger.log('info', '%s (%s) waiting to join.', this.name, this.id, { tag: gs.handUniqueId });
      return Promise.resolve();
    }

    // normalize betAmount to the maximum value the player can pay
    betAmount = Math.min(this.chips, betAmount);

    const playerCallAmount = Math.max(gs.callAmount - this.chipsBet, 0);

    if (betAmount < playerCallAmount && betAmount < this.chips) {
      // when a player bets less than the minimum required amount,
      // and he is not betting all his chips, he's folding.
      return this.fold(gs);
    }

    const hasTalked_ = Symbol.for('has-talked');

    if (betAmount > playerCallAmount) {

      // player is betting a raise.
      // there're some necessary extra checks we've to do before consider the raise valid

      // 1) check current player is in the position to make a raise,
      //    and assure "You can't raise yourself!" motto is respected.
      //    specifically a player who have called for a specific amount,
      //    cant raise, unless the pot was reopened by someone else.

      if (this[hasTalked_]) {
        betAmount = playerCallAmount;
      } else {

        // 2) check minumum raise amount,
        //    and eventually update the data about the last raise.

        const minRaise = playerCallAmount + (gs.lastRaiseAmount || 2 * gs.config.SMALL_BLIND);

        if (betAmount < minRaise) {

          // when the raise does not meet the minimum raise amount,
          // it's allowed only when the player is betting all his chips;
          // however even in this case, it doesn't reopen the bet
          // for the players who have already bet in this hand,
          // that is, last raise data are not updated.

          if (betAmount < this.chips) {
            betAmount = playerCallAmount;
          }
        } else {

          // when the raise amount is valid update
          // lastRaiseAmount gamestate property is updated.

          gs.lastRaiseAmount = betAmount - playerCallAmount;
          gs.players.forEach(player => delete (player[hasTalked_]));
        }
      }
    }

    logger.log('debug', '%s (%s) has bet %d.', this.name, this.id, betAmount, { tag: gs.handUniqueId });

    this[hasTalked_] = true;
    this[update_](gs, betAmount);

    return storage.save({
      type: 'bet',
      handId: gs.handUniqueId,
      session: gs.session,
      playerId: this.id,
      amount: betAmount,
      players: gs.players,
      pot: gs.pot,
    });
  },


  /**
   * @function
   * @name fold
   * @desc
   *  Update the player status.
   *  A folded player can't bet further in the current hand.
   *
   * @param {Object} gs:
   *  the gamestate object
   *
   * @returns {Promise} a promise resolved when updated status is stored
   */
  fold(gs) {
    this.status = playerStatus.folded;

    logger.log('debug', '%s (%s) has folded.', this.name, this.id, { tag: gs.handUniqueId });
    return storage.save({
      type: 'status',
      handId: gs.handUniqueId,
      session: gs.session,
      playerId: this.id,
      status: playerStatus.folded,
      players: gs.players
    });
  },

  leave(gs) {
    this.willLeave = true;

    logger.log('info', '%s (%s) will leave.', this.name, this.id, { tag: gs.handUniqueId });
  },


  /**
   * @function
   * @name pay
   * @desc
   *  Update gamestate, and player's chips.
   *  It's used when the player has not the possibility to define the amount of his bet.
   *
   * @param {Object} gs:
   *  the gamestate object
   * @param {Number}
   *  the amount of chips the player has to pay
   *
   * @returns {void}
   */
  pay(gs, amount) {
    this[update_](gs, Math.min(this.chips, amount));
  },


  /**
   * @function
   * @name talk
   * @desc
   *  Prepare the gamestate model with the only information
   *  each player should know, then send an http request to the service
   *  to get the bet amount
   *
   * @param {Object} gs:
   *  the gamestate object
   *
   * @returns {Promise} a promise resolved when the bot service response arrives
   */
  talk(gs) {
    return new Promise(async (resolve, reject) => {
      try {
        const state = Object.create(null);

        // game number of the current tournament
        state.game = gs.gameProgressiveId;

        // hand number of the current game
        state.hand = gs.handProgressiveId;

        // count the number of time
        // that players had already have the possibility to bet in the current session
        state.spinCount = gs.spinCount;

        // value of the small blinds
        // ... big blind is always twice
        state.sb = gs.config.SMALL_BLIND;

        // value of the pot, and eventually sidepot.
        // are updated after each bet
        state.pot = gs.pot;
        state.sidepots = gs.sidepots;

        state.buyin = this.buyIn;

        // list of the community cards on the table
        // ... everyone is able to access this same list
        state.commonCards = gs.commonCards;

        // index of the player with the dealer button
        state.db = gs.dealerButtonIndex;

        // amount of chips the current player must bet in order to remain in the game;
        // it depends by how much he bet previously
        state.callAmount = Math.max(gs.callAmount - this.chipsBet, 0);

        // minimum amount the player has to bet
        // in case he want to raise the call amount for the other players
        state.minimumRaiseAmount = state.callAmount + (gs.lastRaiseAmount || 2 * gs.config.SMALL_BLIND);

        // the list of the players...
        // make sure that the current players can see only his cards
        state.players = gs.players.map(function (player) {
          const cleanPlayer = {
            id: player.id, name: player.name, status: player.status, chips: player.chips, chipsBet: player.chipsBet
          };
          if (this.id !== player.id) {
            return cleanPlayer;
          }
          cleanPlayer.cards = player.cards;
          return cleanPlayer;
        }, this);

        // index of the player 'this' in the players array
        state.me = gs.players.findIndex(player => player.id === this.id);

        const history = await Update.findAll({
          where: {
            tournamentId: gs.tournamentId,
            handId: state.hand,
            gameId: state.game
          }
        });

        const cleanHistory = getCleanHistory(gs.players[state.me].id, history);

        const requestSettings = {
          body: { state: state, history: cleanHistory },
          json: true,
          followAllRedirects: true,
          maxRedirects: 1,
          timeout: 5000
        };

        request.post(`${this.serviceUrl}bet`, requestSettings, (err, response, playerBetAmount) => {
          if (err) {
            logger.warn('Bet request to %s failed, cause %s', this.serviceUrl, err.message, { tag: gs.handUniqueId });
            if (gs.tableType === 'sandbox') {
              engine.emit('sandbox:update', Object.assign({},
                {
                  id: this.id,
                  botConnected: false,
                  gameCompleted: false,
                  botMessage: 'Please make sure bot url is correct'
                }));

              storage.updateBot({ id: this.id, isActive: false });
              storage.endSession(player.sessionId);
              storage.updateTable({ id: gs.tournamentId, numPlayers: gs.players.length });
              gs.tournamentStatus = gameStatus.stop;
            }
            return void resolve(0);
          }
          engine.emit('sandbox:update', Object.assign({}, { id: this.id, botConnected: true }));
          logger.log('silly', '%s (%s) has bet %s (raw)', this.name, this.id, playerBetAmount, { tag: gs.handUniqueId });
          resolve(sanitizeAmount(playerBetAmount));
        });
      } catch (err) {
        logger.log('error', `Error talking player id: ${this.id}`, err);
        resolve(0);
      }
    });
  },


  /**
   * @function
   * @name showdown
   * @desc
   *  Compute the player best combination
   *
   * @param {Array} commonCards:
   *  the list of cards displayed on the table
   *
   * @returns {Array} The strongest cards combination
   */
  showdown(commonCards) {
    const allCombinations = getCombinations(this.cards.concat(commonCards), 5);
    const strongestCombination = sortByRank(allCombinations)[0];

    const strongestCombinationCards = allCombinations[strongestCombination.index];
    logger.log('debug', '%s (%s) best combination is %s', this.name, this.id, getBestCombinationCardsLogMessage(strongestCombinationCards));

    return this.bestCombination = strongestCombinationCards;
  }

};

function getCleanHistory(id, history) {
  history.map(update => {
    if (Array.isArray(update.players)) {
      for (let player of update.players) {
        if (player.id !== id) {
          delete player.cards;
        }

        delete player.botType;
        delete player.id;
        delete player.totalWinnings;
        delete player.willLeave;
        delete player.willJoin;
        delete player.sessionId;
        delete player.bestCombination;
        delete player.bestCombinationData;
      }
    }

    delete update.tournamentId;
    delete update.id;
    update.playerId = null;
  });
  return history;
}


/**
 * @private
 * @function
 * @name isValidPlayer
 * @desc check if the input parameter match the "player interface".
 *
 * @param {Object} player
 *
 * @returns {Boolean} true when the input parameter is a valid "player" object; false otherwise
 */
function isValidPlayer(player) {
  return player.id && player.name && player.serviceUrl;
}

/**
 * @private
 * @function
 * @name sanitizeAmount
 * @desc check if the value is a valid bet amount
 *
 * @param {Number} amount
 *
 * @returns {Number} amount (valid)
 */
function sanitizeAmount(amount) {
  if (typeof amount != 'number') {
    amount = Number.parseInt(amount, 10);
  }
  return amount > -2 ? amount : 0;
}

/**
 * @private
 * @function
 * @name getBestCombinationCardsLogMessage
 * @desc
 *  return a log of the player best combination
 *
 * @param {Array} cards
 *  list of the cards
 *
 * @returns {String}
 */
function getBestCombinationCardsLogMessage(cards) {
  return cards
    .reduce(function (all, card) {
      all += `${card.rank}${card.type}, `;
      return all;
    }, '').trim().slice(0, -1);
}


/**
 * @function
 * @name factory
 * @desc create a new "player" object
 *
 * @param {Object} obj
 *  - player.id
 *  - player.name
 *  - player.serviceUrl
 *
 *  @param {Object} gs
 *  - game state
 *
 * @returns {object|null} the player object created
 */
exports = module.exports = async function factory(obj, gs) {
  return new Promise(async resolve => {
    if (!isValidPlayer(obj)) {
      logger.warn('Registered an attempt to sign an invalid player', obj);
      return null;
    }

    const player = Object.create(actions);

    ['name', 'serviceUrl', 'userId']
      .forEach(prop => Object.defineProperty(player, prop, { value: obj[prop] }));

    // status of the player
    player.status = playerStatus.active;

    player.id = obj.id;

    player.sessionId = null;

    player.willLeave = false;

    player.willJoin = true;

    player.botType = obj.botType;

    player.buyIn = obj.buyin ? obj.buyin : (gs.config.MAX_BUYIN + gs.config.MIN_BUYIN) / 2;

    // amount of chips available
    player.chips = player.buyIn;

    player.totalWinnings = obj.totalWinnings;

    // two private cards of the player
    player.cards = [];

    // total amount of chips the player bet
    // in the current hand.
    // it is the sum of the chips the player has bet
    // in each "betting session" of the current hand.
    player.chipsBet = 0;

    if (gs.tableType !== 'sandbox' && player.botType === 'userBot') {
      await storage.updateUser({ id: player.userId, chips: (player.chips * -1) });
      await storage.updateBot({ id: player.id, totalWinnings: (player.totalWinnings - obj.buyin) });
      player.totalWinnings = player.totalWinnings - obj.buyin;
    }

    logger.info('%s (%s), registered as player.', player.name, player.id);

    resolve(player);
  });
};
