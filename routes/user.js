const express = require('express');
const router = express.Router();
const models = require('../models');
const User = models.User;
const Token = models.Token;
const Friend = models.Friend;
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const email = require('../controllers/email');
const moment = require('moment');
const Op = require('sequelize').Op;

const REFERRAL_REWARD = 2000;

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

router.get('/referral/:email', passport.authenticate('jwt', {session: false}), async (req, res) => {
  User.findOne({
    where: {
      id: req.user.dataValues.id
    },
    attributes: ['username', 'referralCode']
  }).then(user => {
    email.sendReferral(`http:\/\/probotplayground.com\/#\/auth\/signup\/${user.referralCode}`, req.params.email, user.username);
    res.status(200).json({msg: 'Referral link sent!'});
  }).catch(err => {
    return res.status(400).json({msg: 'Error finding user', error: err});
  })
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
      },
      attributes: ['id', 'isVerified', 'referredBy', 'chips', 'referralCode', 'username']
    }).then(user => {
      if (!user) {
        return res.status(400).json({msg: 'Unable to find user'});
      }

      user.isVerified = true;

      if (user.referredBy) {
        user.chips += REFERRAL_REWARD;

        User.findOne({
          where: {
            referralCode: user.referredBy
          },
          attributes: ['id', 'chips', 'referralCode', 'username']
        }).then(referralUser => {
          if (referralUser) {
            Friend.create({userId: user.id, friendId: referralUser.id});
            Friend.create({userId: referralUser.id, friendId: user.id});

            referralUser.chips += REFERRAL_REWARD;
            referralUser.save();
          }
        }).catch(err => {
          console.log(err);
          return res.status(400).json({msg: 'Error finding referral user', error: err});
        })
      }

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

router.get('/add/friend/:email', passport.authenticate('jwt', {session: false}), async (req, res) => {
  User.findOne({
    where: {
      id: req.user.dataValues.id
    },
    attributes: ['email', 'username']
  }).then(user => {
    email.sendFriendInvite(`http:\/\/probotplayground.com\/api\/user\/accept\/friend-request\/${user.email}\/${req.params.email}`, req.params.email, user.username);
    res.status(200).json({msg: 'Friend request sent!'});
  }).catch(err => {
    return res.status(400).json({msg: 'Error finding user', error: err});
  });
});

router.get('/accept/friend-request/:requestEmail/:acceptEmail', async (req, res) => {
  User.findAll({
    where: {
      email: {
        [Op.in]: [req.params.requestEmail, req.params.acceptEmail]
      }
    },
    attributes: ['id']
  }).then(users => {
    if (users.length === 2) {
      Friend.create({userId: users[0].id, friendId: users[1].id});
      Friend.create({userId: users[1].id, friendId: users[0].id});
      return res.status(200).json({msg: 'Friend request accepted'});
    }
    return res.status(200).json({msg: 'Friend request denied'});
  }).catch(err => rea.status(400).json({msg: 'Error accepting friend request', error: err}));
});

router.post('/get/friends', passport.authenticate('jwt', {session: false}), async (req, res) => {
  User.findAll({
    where: {
      id: {
        [Op.in]: req.body
      }
    }
  }).then(friends => res.status(200).json({msg: 'Friends Retrieved', friends: friends}))
    .catch(err => {
      console.log(err);
      res.status(400).json({msg: 'Error getting friends', error: err});
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
      [Op.or]: [{
        email: req.body.email
      }, {
        username: req.body.username
      }]
    }
  }).then((user) => {
    if (!user) {
      return res.status(200).json({
        exists: false,
        msg: 'Email and username available',
      });
    }

    if (user.email === req.body.email) {
      return res.status(200).json({
        exists: true,
        msg: 'Email already used',
      });
    }

    return res.status(200).json({
      exists: true,
      msg: 'Username already used',
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
    }, {
      as: 'friends',
      model: models.Friend,
      attributes: ['friendId']
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
      isVerified: req.body.isVerified,
      firstLoggedIn: req.body.firstLoggedIn
    }).then(updatedUser => res.status(200).json(updatedUser))
      .catch(error => res.status(400).json({msg: 'Error updating user', error: error})))
    .catch((error) => res.status(400).json({msg: 'Error finding user', error: error}));
});


module.exports = router;
