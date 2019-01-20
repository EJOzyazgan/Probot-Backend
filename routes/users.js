const express = require('express');
const router = express.Router();
const {User} = require('../models/user');
const passport = require('passport');
const auth = require('../middleware/auth');

router.post('/create', auth.optional, async (req, res) => {
    let user = req.body;

    const finalUser = new User(user);
    finalUser.setPassword(user.password);

    return finalUser.save()
        .then(() => res.json({ user: finalUser.toAuthJSON() }));
});

router.post('/login', auth.optional, async (req, res, next) => {
    return passport.authenticate('user', { session: false }, (err, passportUser, info) => {
        if(err) {
            return next(err);
        }

        if(passportUser) {
            const user = passportUser;
            user.token = passportUser.generateJWT();

            return res.json({ user: user.toAuthJSON() });
        }

        return res.status(400).info;
    })(req, res, next);
});

router.post('/exists', auth.optional, (req, res) => {
    User.find({email: req.body.email}).then((users) => {
        res.status(200).send(users);
    }).catch((e) => {
        res.status(400).send(e);
    })
});

router.post('/get', auth.required, (req, res) => {
    User.findById(req.body.userId).then((user) => {
        res.status(200).send(user);
    }).catch((e) => {
        res.status(400).send(e);
    })
});

router.post('/get/users', auth.required, (req, res) => {
    User.find({_id: {$ne: req.body.userId}}).then((user) => {
        res.send(user);
    }).catch((e) => {
        res.status(400).send(e);
    });
});

router.delete('/delete', auth.required, (req, res) => {

});

module.exports = router;
