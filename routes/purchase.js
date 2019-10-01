const express = require('express');
const router = express.Router();
const passport = require('passport');
const models = require('../models');
const Purchase = models.Purchase;

router.post('/save', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    await Purchase.create(req.body);
    return res.status(200).json({msg: 'Purchase Saved'});
  } catch (err) {
    return res.status(400).json({msg: 'Purchase save failed'}, err);
  }
});

module.exports = router;