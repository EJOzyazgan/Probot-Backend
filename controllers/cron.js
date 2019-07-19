const CronJob = require('cron').CronJob;
const Op = require('sequelize').Op;
const models = require('../models');
const User = models.User;

const DAILY_TOP_OFF = 1000;

const rankUsers = new CronJob('0 */1 * * * *', function () {
  const d = new Date();
  console.log('Ran:', d);
  User.findAll({
    order: [['chips', 'DESC']]
  }).then(users => {
    for (let i = 0; i < users.length; i++) {
      const rank = i + 1;
      users[i].rank = rank;

      if (rank <= users.length * 0.1)
        users[i].rankClass = 'Diamond';
      else if (rank <= users.length * 0.30)
        users[i].rankClass = 'Gold';
      else if (rank <=users.length * 0.60)
        users[i].rankClass = 'Silver';
      else
        users[i].rankClass = 'Bronze';

      users[i].save();
    }
  })
}, null, true, 'America/Los_Angeles');

const topOffChips = new CronJob('00 00 00 * * *', function () {
  const d = new Date();
  console.log('Ran:', d);
  User.findAll({
    where: {
      chips: {
        [Op.lt]: DAILY_TOP_OFF
      }
    }
  }).then(users => {
    for (let i = 0; i < users.length; i++) {
      users[i].chips = DAILY_TOP_OFF;
      users[i].save();
    }
  })
}, null, true, 'America/Los_Angeles');

const startAll = () => {
  rankUsers.start();
  topOffChips.start();
};

startAll();
