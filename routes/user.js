const express = require('express');
const router = express.Router();
const models = require('../models');
const User = models.User;
const Token = models.Token;
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const email = require('../controllers/email');
const moment = require('moment');

router.post('/create', async (req, res) => {
  User.create(req.body)
    .then(async (user) => {
      let token = await Token.create({
        userId: user.id,
        token: crypto.randomBytes(16).toString('hex'),
        tokenExpires: moment().add(1, 'hour').format()
      });

      email.sendAccountVerification(`http:\/\/probotplayground.com\/api\/user\/validate\/token\/${token.token}`, user.email);
      return res.status(200).json(user)
    })
    .catch((error) => {
      return res.status(400).json({msg: 'Error creating user', error: error});
    });
});

router.get('/validate/token/:token', async (req, res) => {
  Token.findOne({
    where: {
      token: req.params.token,
    }
  }).then(token => {
    if (!token || moment(token.tokenExpires).diff(moment()) < 0) {
      Token.destroy({where: {id: token.id}});
      return res.status(401).json({msg: 'Not a valid token'})
    }

    User.findOne({
      where: {
        id: token.userId
      }
    }).then(user => {
      if (!user) {
        return res.status(400).json({msg: 'Unable to find user'})
      }

      user.isVerified = true;
      user.save().then(savedUser => {
        if (!savedUser) {
          return res.status(400).json({msg: 'Unable to update user'})
        }

        Token.destroy({where: {id: token.id}});

        return res.status(200).json({msg: 'User verified'})
      }).catch(err => {
        return res.status(400).json({msg: 'Unable to update user', error: err})
      });
    }).catch(err => {
      return res.status(400).json({msg: 'Unable to find user', error: err})
    });
  }).catch(err => {
    return res.status(400).json({msg: 'Unable to find token', error: err})
  });
});

router.get('/validate/reset-password/:token', passport.authenticate('jwt', {session: false}), async (req, res) => {
  User.findOne({
    where: {
      id: req.user.dataValues.id
    },
    attributes: {exclude: ['password']}
  }).then((user) => {
    if (!user) {
      return res.status(401).json({msg: 'Valid user not found'});
    }
    return res.status(200).json(user);
  }).catch((e) => {
    res.status(400).json({msg: 'Error finding user', error: e});
  });
});

router.get('/reset-password/:email', async (req, res) => {
  User.findOne({
    where: {
      email: req.params.email
    }
  }).then(user => {
    if (!user) {
      return res.status(200).json({msg: 'User with that email not found'})
    }

    let token = jwt.sign(JSON.parse(JSON.stringify(user)), process.env.JWTSecretKey, {expiresIn: 86400 * 30});
    jwt.verify(token, process.env.JWTSecretKey, function (err, data) {
      if (err)
        console.log(err);
    });

    email.sendResetPassword(`http:\/\/probotplayground.com\/#\/auth\/reset-password\/${token}`, req.params.email);
    return res.status(200).json({msg: 'Reset password email sent'});
  }).catch(error => {

  });
});

router.post('/login', async (req, res, next) => {
  User.findOne({
    where: {
      email: req.body.email
    }
  }).then((user) => {
    if (!user) {
      return res.status(400).send({
        msg: 'Authentication failed. User not found.'
      });
    } else if (!user.isVerified) {
      return res.status(401).send({
        msg: 'Please verify your email.'
      });
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (isMatch && !err) {
        let token = jwt.sign(JSON.parse(JSON.stringify(user)), process.env.JWTSecretKey, {expiresIn: 86400 * 30});
        jwt.verify(token, process.env.JWTSecretKey, function (err, data) {
          if (err)
            console.log(err);
        });
        return res.status(200).json({success: true, token: token});
      }
      return res.status(400).send({success: false, msg: 'Authentication failed. Wrong password.'});
    })
  }).catch((error) => res.status(400).send(error));
});

router.post('/exists', async (req, res) => {
  User.findOne({
    where: {
      email: req.body.email
    }
  }).then((user) => {
    if (!user) {
      return res.status(200).json({
        exists: false,
        msg: 'Email not already used',
      });
    }
    return res.status(200).json({
      exists: true,
      msg: 'Email already used',
    });
  }).catch((error) => res.status(400).json({msg: 'Error finding account', error: error}));
});

router.get('/get', passport.authenticate('jwt', {session: false}), async (req, res) => {
  User.findOne({
    where: {
      id: req.user.dataValues.id
    },
    attributes: {exclude: ['password']},
    include: [{
      as: 'bots',
      model: models.Bot
    }]
  }).then((user) => {
    return res.status(200).json(user);
  }).catch((e) => {
    res.status(400).json({msg: 'Error finding user', error: e});
  });
});

router.patch('/patch', passport.authenticate('jwt', {session: false}), async (req, res) => {
  User.findOne({
    where: {
      id: req.user.dataValues.id
    }
  }).then(user =>
    user.update({
      email: req.body.email,
      password: req.body.password,
      username: req.body.username,
      lastLoggedIn: req.body.lastLoggedIn,
      daysLoggedIn: req.body.daysLoggedIn,
      chips: req.body.chips,
      rankClass: req.body.rankClass,
      rank: req.body.rank,
      totalWinnings: req.body.totalWinnings,
      friends: req.body.friends,
      icon: req.body.icon,
      isAdmin: req.body.isAdmin,
      passwordResetToken: req.body.passwordResetToken,
      passwordResetExpires: req.body.passwordResetExpires,
      isVerified: req.body.isVerified

    }).then(updatedUser => res.status(200).json(updatedUser))
      .catch(error => res.status(400).json({msg: 'Error updating user', error: error})))
    .catch((error) => res.status(400).json({msg: 'Error finding user', error: error}));
});

module.exports = router;
