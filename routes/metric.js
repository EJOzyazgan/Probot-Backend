const express = require('express');
const router = express.Router();
const passport = require('passport');
const models = require('../models');
const Metric = models.Metric;
const Bot = models.Bot;
const User = models.User;
const Table = models.Table;
const Op = require('sequelize').Op;
const moment = require('moment');
const contants = require('../config/constants');

router.post('/get/metric', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  Metric.findAll({
    where: {
      botId: req.body.botId ? req.body.botId : null,
      createdAt: {
        [Op.gte]: moment().subtract(1, req.body.period).format(),
        [Op.lte]: moment().format()
      },
      metricType: req.body.metricType
    },
    order: [['createdAt', 'ASC']]
  }).then(metrics => {
    res.status(200).send(getFormattedMetrics(metrics, req.body.period, req.body.metricType));
  }).catch(err => {
    console.log(err);
    res.status(400).json({ msg: 'Error Retrieving Metrics', error: err });
  })
});

router.get('/platform-analytics', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const platformAnalytics = {};

  await Bot.findAll({
    where: {
      isActive: true
    },
    attributes: ['id']
  }).then(bots => {
    platformAnalytics.activeBots = bots.length;
  }).catch(err => {
    return res.status(400).json({ msg: 'Error getting platformAnalytics bots', error: err });
  });

  await Table.findAll({
    where: {
      isActive: true
    },
    attributes: ['id']
  }).then(tables => {
    platformAnalytics.activeTables = tables.length;
  }).catch(err => {
    return res.status(400).json({ msg: 'Error getting platformAnalytics tables', error: err });
  });

  await Metric.findAll({
    where: {
      metricType: contants.PLATFORM_HAND_PLAYED
    },
    attributes: ['id']
  }).then(hands => {
    platformAnalytics.platformHandsPlayed = hands.length;
  }).catch(err => {
    return res.status(400).json({ msg: 'Error getting platformAnalytics hands', error: err });
  });

  return res.status(200).json(platformAnalytics);
});

router.get('/user-analytics', passport.authenticate('jwt', { session: false }), (req, res) => {
  User.findAll({
    attributes: ['id', 'referrals', 'isVerified', 'referredBy', 'lastLoggedIn']
  }).then(users => {
    return res.status(200).json(calculateUserAnalytics(users));
  }).catch(err => {
    return res.status(400).json({ msg: 'Error getting user analytics', error: err });
  });
});

router.get('/top-players', passport.authenticate('jwt', { session: false }), async (req, res) => {
  User.findAll({
    where: {
      isAdmin: false,
    },
    order: [['rank', 'ASC']],
    attributes: ['id', 'username', 'icon', 'rank', 'rankClass'],
    limit: 100,
  }).then(topPlayers => {
    if (topPlayers.length >= 100) {
      let nonZeroIndex = 0;

      for (let i = 0; i < topPlayers.length; i++) {
        if (topPlayers[i].rank > 0) {
          nonZeroIndex = i;
          break;
        }
      }

      const zeroRank = topPlayers.splice(0, nonZeroIndex);
      topPlayers = topPlayers.concat(zeroRank);

      res.status(200).send(topPlayers)
    } else {
      res.status(200).send([]);
    }
  })
    .catch(err => {
      res.status(400).json({ msg: 'Error getting top players', error: err });
    });
});

router.get('/user-standing', passport.authenticate('jwt', { session: false }), async (req, res) => {
  User.findOne({
    where: {
      id: req.user.dataValues.id,
    },
    attributes: ['id', 'username', 'icon', 'rank', 'rankClass'],
  }).then(user => res.status(200).send(user))
    .catch(err => {
      res.status(400).json({ msg: 'Error getting user standing', error: err });
    });
});

const calculateUserAnalytics = users => {
  let activeUsers = 0;
  let monthlyUser = 0;
  let usersWhoReferred = 0;
  let referralsSent = 0;
  let referralsActivated = 0;
  let accountsActivated = 0;

  const now = moment();

  for (let user of users) {
    if (moment(user.lastLoggedIn).diff(now, 'month') > -1)
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

  return {
    activeUsers,
    usersWhoReferred,
    referralsSent,
    referralsActivated,
    accountsActivated,
    accountsCreated: users.length
  };
};

const getFormattedMetrics = (metrics, period, type) => {
  if (period === 'day')
    return formatMetrics(metrics, period, 30, 'minutes', type);
  else if (period === 'week')
    return formatMetrics(metrics, period, 3, 'hours', type);
  else if (period === 'month')
    return formatMetrics(metrics, period, 12, 'hours', type);
  else if (period === 'year')
    return formatMetrics(metrics, period, 1, 'weeks', type);
};

const formatMetrics = (metrics, period, timeFrame, blockUnit, type) => {
  let formatted = [];

  let totalValue = 0;
  let numPoints = 0;
  let lastIndex = 0;

  let timeBlock = moment().subtract(1, period);

  while (timeBlock.diff(moment()) < 0) {
    for (let i = lastIndex; i < metrics.length; i++) {
      if (moment(metrics[i].createdAt).diff(timeBlock) >= 0 &&
        moment(metrics[i].createdAt).diff(moment(timeBlock).add(timeFrame, blockUnit)) < 0) {
        totalValue += metrics[i].value;
        numPoints++;
      } else {
        lastIndex = i;;
        break;
      }
    }

    if (numPoints === 0) {
      formatted.push({ createdAt: timeBlock.format(), value: 0 });
    } else {
      let value = totalValue;
      if (!type.toLowerCase().includes('hand')) {
        value = value / numPoints;
      }
      formatted.push({ createdAt: timeBlock.format(), value });
    }
    totalValue = 0;
    numPoints = 0;

    timeBlock.add(timeFrame, blockUnit);
  }

  return formatted
};

module.exports = router;
