const constants = require('../config/constants');
const models = require('../models');
const moment = require('moment');
const Metric = models.Metric;

const startTime = moment().subtract(1, 'year');
const botId = process.env.BOT_ID;

const endTime = moment();

const types = [constants.HAND_PLAYED, constants.HAND_WON, constants.TOTAL_WINNINGS];

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

    Metric.create(data);
  }

  startTime.add(1, 'day');
}
