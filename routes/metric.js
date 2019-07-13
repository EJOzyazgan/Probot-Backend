const express = require('express');
const router = express.Router();
const passport = require('passport');
const models = require('../models');
const Metric = models.Metric;
const Op = require('sequelize').Op;

router.post('/get/:id', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    Metric.findAll({
      where: {
        botId: req.params.id,
        createdAt: {
          [Op.gte]: req.body.startTime,
          [Op.lte]: req.body.endTime
        },
        metricType: req.body.metricType
      },
      order: [['createdAt', 'ASC']]
    }).then(metrics => {
      res.status(200).send(metrics);
    }).catch(err => {
      res.status(400).json({msg: 'Error Retrieving Metrics', error: err});
    })
});

module.exports = router;
