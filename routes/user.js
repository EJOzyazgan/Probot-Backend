const express = require('express');
const router = express.Router();
const models = require('../models');
const User = models.User;
const Bot = models.Bot;
const Token = models.Token;
const Friend = models.Friend;
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const email = require('../controllers/email');
const moment = require('moment');
const Op = require('sequelize').Op;
const fs = require('fs');
const path = require('path');

const REFERRAL_REWARD = 2000;

const privateKeyPath = path.join(__dirname, '../config/private.key');
const publicKeyPath = path.join(__dirname, '../config/public.key');

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

router.post('/create', async (req, res) => {
  User.create(req.body)
    .then(async (user) => {
      const token = await Token.create({
        userId: user.id,
        token: crypto.randomBytes(16).toString('hex'),
        tokenExpires: moment().add(1, 'hour').format()
      });

      email.sendAccountVerification(`http:\/\/probotplayground.com\/#\/auth\/email-verification\/${token.token}`, user.email, user.username);
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
    attributes: ['username', 'referralCode', 'email']
  }).then(user => {
    email.sendReferral(`http:\/\/probotplayground.com\/#\/auth\/signup\/${user.referralCode}`, req.params.email, user.username, REFERRAL_REWARD, user.email);
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
      attributes: ['id', 'isVerified', 'referredBy', 'chips', 'referralCode', 'username', 'email']
    }).then(user => {
      if (!user) {
        return res.status(400).json({msg: 'Unable to find user'});
      }

      user.isVerified = true;
      user.referralCode = user.email.split('@', 1)[0] + '-' + crypto.randomBytes(4).toString('hex');

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

    const token = jwt.sign({id: user.id}, privateKey, {
      algorithm: 'RS256',
      expiresIn: '1h'
    });

    let error = false;

    jwt.verify(token, publicKey, function (err, data) {
      if (err) {
        error = true;
        return res.status(400).send({success: false, msg: 'Error reset password email token'});
      }
    });

    if (!error) {
      email.sendResetPassword(`http:\/\/probotplayground.com\/#\/auth\/reset-password\/${token}`, req.params.email, user.username);
      return res.status(200).json({msg: 'Reset password email sent'});
    }
  }).catch(error => {

  });
});

router.get('/add/friend/:email', passport.authenticate('jwt', {session: false}), async (req, res) => {
  User.findOne({
    where: {
      id: req.user.dataValues.id
    },
    attributes: ['referralCode', 'username', 'email']
  }).then(user => {
    User.findOne({
      where: {
        email: req.params.email
      }
    }).then(friend => {
      email.sendFriendInvite(`http:\/\/probotplayground.com\/#\/auth\/friend-request\/${user.referralCode}\/${friend.referralCode}`, friend.email, friend.username, user.username, user.email);
      res.status(200).json({msg: 'Friend request sent!'});
    }).catch(err => {
      return res.status(400).json({msg: 'Error finding user', error: err});
    });
  }).catch(err => {
    return res.status(400).json({msg: 'Error finding user', error: err});
  });
});

router.get('/accept/friend-request/:userReferral/:friendReferral', async (req, res) => {
  User.findAll({
    where: {
      referralCode: {
        [Op.in]: [req.params.userReferral, req.params.friendReferral]
      }
    },
    attributes: ['id']
  }).then(users => {
    console.log(users);
    if (users.length === 2) {
      Friend.create({userId: users[0].id, friendId: users[1].id});
      Friend.create({userId: users[1].id, friendId: users[0].id});
      return res.status(200).json({msg: 'Friend request accepted'});
    }
    return res.status(200).json({msg: 'Not enough users found'});
  }).catch(err => rea.status(400).json({msg: 'Error accepting friend request', error: err}));
});

router.post('/get/friends', passport.authenticate('jwt', {session: false}), async (req, res) => {
  User.findAll({
    where: {
      id: {
        [Op.in]: req.body
      }
    },
    order: [['rank', 'ASC']],
    attributes: ['id', 'username', 'icon', 'rank', 'rankClass'],
  }).then(friends => res.status(200).send(friends))
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
  }).then(user => {
    if (!user) {
      return res.status(400).send({
        msg: 'Authentication failed. User not found.'
      });
    } else if (!user.isVerified) {
      return res.status(401).send({
        msg: 'Please verify your email.'
      });
    }

    user.comparePassword(req.body.password, async (err, isMatch) => {
      let error = false;

      if (isMatch && !err) {
        const token = jwt.sign({id: user.id}, privateKey, {
          algorithm: 'RS256',
          expiresIn: '15m'
        });

        jwt.verify(token, publicKey, function (err, data) {
          if (err) {
            error = true;
            return res.status(400).send({success: false, msg: 'Error logging in'});
          }
        });

        if (!error) {
          user.refreshToken = crypto.randomBytes(32).toString('hex');
          console.log(user.refreshToken);
          await user.save();
          return res.status(200).json({
            success: true,
            token,
            expiresAt: moment().add(15, 'm').format(),
            refreshToken: user.refreshToken
          });
        }
      } else {
        return res.status(400).send({success: false, msg: 'Authentication failed. Wrong password.'});
      }
    })
  }).catch((error) => res.status(400).send(error));
});

router.get('/refresh-token/:refreshToken', async (req, res) => {
  User.findOne({
    where: {
      refreshToken: req.params.refreshToken
    }
  }).then(async user => {
    if (!user) {
      return res.status(400).send({
        msg: 'Authentication failed. User not found.'
      });
    }

    let error = false;

    const token = jwt.sign({id: user.id}, privateKey, {
      algorithm: 'RS256',
      expiresIn: '15m'
    });

    jwt.verify(token, publicKey, function (err, data) {
      if (err) {
        error = true;
        return res.status(400).send({success: false, msg: 'Error logging in'});
      }
    });

    if (!error) {
      user.refreshToken = crypto.randomBytes(32).toString('hex');
      await user.save();
      return res.status(200).json({
        success: true,
        token,
        expiresAt: moment().add(15, 'm').format(),
        refreshToken: user.refreshToken
      });
    }
    return res.status(400).send({success: false, msg: 'Authentication failed. Wrong password.'});
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
      as: 'friends',
      model: models.Friend,
      attributes: ['friendId']
    }]
  }).then((user) => {
    return res.status(200).json(user);
  }).catch((err) => {
    return res.status(400).json({msg: 'Error finding user', error: err});
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

