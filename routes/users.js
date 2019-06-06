const express = require('express');
const router = express.Router();
const models = require('../models');
const User = models.User;
const passport = require('passport');
const jwt = require('jsonwebtoken');

router.post('/create', async (req, res) => {
    User.create(req.body)
        .then((user) => res.status(200).json(user))
        .catch((error) => {
            console.log(error);
            res.status(400).json({msg: 'Error creating user', error: error});
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
                msg: 'Authentication failed. User not found.',
            });
        }
        user.comparePassword(req.body.password, (err, isMatch) => {
            if (isMatch && !err) {
                let token = jwt.sign(JSON.parse(JSON.stringify(user)), process.env.JWTSecretKey, {expiresIn: 86400 * 30});
                jwt.verify(token, process.env.JWTSecretKey, function (err, data) {
                    if (err)
                        console.log(err);
                });
                res.json({success: true, token: token});
            } else {
                res.status(400).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
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
        attributes: { exclude: ['password', 'isAdmin'] },
        include: [{
            as: 'bots',
            model:  models.Bot
        }]
    }).then((user) => {
        return res.status(200).json(user);
    }).catch((e) => {
        res.status(400).json({msg: 'Error finding user', error: e});
    });
});

router.patch('/patch', passport.authenticate('jwt', {session: false}), async (req, res) => {
    User.update({
        email: req.body.email,
        password: req.body.password,
        lastLoggedIn: req.body.lastLoggedIn,
        daysLoggedIn: req.body.daysLoggedIn,
        chips: req.body.chips,
        rankClass: req.body.rankClass,
        rank: req.body.rank,
        totalWinnings: req.body.totalWinnings,
        friends: req.body.friends,
        icon: req.body.icon,
        isAdmin: req.body.isAdmin
    }, {
        where: {
            id: req.user.dataValues.id
        },
        returning: true
    }).then(([ rowsUpdate, [updatedUser] ]) => {
        return res.status(200).json(updatedUser);
    }).catch((e) => {
        res.status(400).json({msg: 'Error updating user', error: e});
    });
});

router.delete('/delete', async (req, res) => {

});

module.exports = router;
