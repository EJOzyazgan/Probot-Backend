const CronJob = require('cron').CronJob;
const Op = require('sequelize').Op;
const models = require('../models');
const moment = require('moment');
const User = models.User;
const Table = models.Table;
const Bot = models.Bot;
const Metric = models.Metric;
const constants = require('../config/constants');

const DAILY_TOP_OFF = 1000;

const rankUsers = new CronJob('0 */1 * * * *', function () {
  User.findAll({
    order: [['chips', 'DESC']],
    attributes: ['id', 'rank', 'rankClass'],
  }).then(users => {
    for (let i = 0; i < users.length; i++) {
      const rank = i + 1;
      users[i].rank = rank;

      if (rank <= users.length * 0.1)
        users[i].rankClass = 'Diamond';
      else if (rank <= users.length * 0.30)
        users[i].rankClass = 'Gold';
      else if (rank <= users.length * 0.60)
        users[i].rankClass = 'Silver';
      else
        users[i].rankClass = 'Bronze';

      users[i].save();
    }
  })
}, null, true, 'America/Los_Angeles');

const topOffChips = new CronJob('00 00 00 * * *', function () {
  User.findAll({
    where: {
      chips: {
        [Op.lt]: DAILY_TOP_OFF
      }
    },
    attributes: ['id', 'chips'],
  }).then(users => {
    for (let i = 0; i < users.length; i++) {
      users[i].chips = DAILY_TOP_OFF;
      users[i].save();
    }
  })
}, null, true, 'America/Los_Angeles');

const recordUserMetrics = new CronJob('00 00 12,00 * * *', function () {
  User.findAll({
    attributes: ['id', 'referrals', 'isVerified', 'referredBy', 'lastLoggedIn']
  }).then(users => {
    let activeUsers = 0;
    let usersWhoReferred = 0;
    let referralsSent = 0;
    let referralsActivated = 0;
    let accountsActivated = 0;

    const now = moment();

    for (let user of users) {
      if (moment(user.lastLoggedIn).diff(now, 'weeks') > -1)
        activeUsers++;

      if (user.referrals > 0) {
        usersWhoReferred++;
        referralsSent += user.referrals;
      }

      if (user.referredBy && user.isVerified) {
        referralsActivated++;
        accountsActivated++;
      } else if (user.isVerified) {
        accountsActivated++;
      }
    }

    Metric.create({
      metricType: constants.REFERRAL_RATE,
      value: users.length > 0 ? (usersWhoReferred / users.length) * 100 : 0,
    });

    Metric.create({
      metricType: constants.REFERRAL_ACTIVATION_RATE,
      value: referralsSent > 0 ? (referralsActivated / referralsSent) * 100 : 0,
    });

    Metric.create({
      metricType: constants.ACTIVATION_RATE,
      value: users.length > 0 ? (accountsActivated / users.length) * 100 : 0,
    });
  });
}, null, true, 'America/Los_Angeles');

const recordUsageMetrics = new CronJob('0 */1 * * * *', function () {
  Table.findAll({
    where: {
      isActive: true,
    }
  }).then(tables => {
    Metric.create({
      metricType: constants.ACTIVE_TABLES,
      value: tables.length,
    });
  });

  Bot.findAll({
    where: {
      isActive: true,
    }
  }).then(bots => {
    Metric.create({
      metricType: constants.ACTIVE_BOTS,
      value: bots.length,
    });
  })
}, null, true, 'America/Los_Angeles');

const startAll = () => {
  rankUsers.start();
  topOffChips.start();
  recordUserMetrics.start();
  recordUsageMetrics.start();
};

startAll();
