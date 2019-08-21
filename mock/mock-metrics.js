const constants = require('../config/constants');
const models = require('../models');
const moment = require('moment');
const Metric = models.Metric;

const startTime = moment().subtract(1, 'year');
const endTime = moment();

const metricType = process.argv[2];
const botId = parseInt(process.argv[3]);

const userType = [constants.HAND_PLAYED, constants.HAND_WON, constants.TOTAL_WINNINGS];
const adminType = [constants.PLATFORM_HAND_PLAYED, constants.REFERRAL_RATE,
  constants.REFERRAL_ACTIVATION_RATE, constants.REFERRAL_RATE];

let types = userType;

if (metricType && metricType === 'admin') {
  types = adminType;
}

createMetrics();

async function createMetrics () {
  while (startTime.diff(endTime) < 0) {
    for (let i = 0; i < 3; i++) {
      let data = {
        metricType: types[i],
        botId: botId,
        createdAt: startTime.format()
      };
  
      if (i < 2) {
        data.value = Math.floor((Math.random() * 100) + 1);
      } else {
        data.value = Math.floor((Math.random() * 200) - 100);
      }
  
      await Metric.create(data);
    }
  
    startTime.add(15, 'minutes');
  }
}
