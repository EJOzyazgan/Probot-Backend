const express = require('express');
const router = express.Router();
const passport = require('passport');
const models = require('../models');
const Metric = models.Metric;
const Op = require('sequelize').Op;
const moment = require('moment');

router.post('/get/:id', passport.authenticate('jwt', {session: false}), (req, res, next) => {
  Metric.findAll({
    where: {
      botId: req.params.id,
      createdAt: {
        [Op.gte]: moment().subtract(1, req.body.period).format(),
        [Op.lte]: moment().format()
      },
      metricType: req.body.metricType
    },
    order: [['createdAt', 'ASC']]
  }).then(metrics => {
    res.status(200).send(getFormatedMetrics(metrics, req.body.period));
  }).catch(err => {
    res.status(400).json({msg: 'Error Retrieving Metrics', error: err});
  })
});

const getFormatedMetrics = (metrics, period) => {
  if (period === 'day')
    return formatMetrics(metrics, period, 30, 'minutes');
  else if (period === 'week')
    return formatMetrics(metrics, period, 3, 'hours');
  else if (period === 'month')
    return formatMetrics(metrics, period, 12, 'hours');
  else if (period === 'year')
    return formatMetrics(metrics, period, 1, 'weeks');
};

const formatMetrics = (metrics, period, timeFrame, blockUnit) => {
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
        lastIndex = i + 1;
        break;
      }
    }

    if (numPoints === 0)
      formatted.push({createdAt: timeBlock.format(), value: 0});
    else
      formatted.push({createdAt: timeBlock.format(), value: totalValue / numPoints});
    totalValue = 0;
    numPoints = 0;

    timeBlock.add(timeFrame, blockUnit);
  }

  return formatted
};

module.exports = router;
