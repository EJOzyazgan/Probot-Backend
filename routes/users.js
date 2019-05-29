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
        .then(() => res.status(200).json({user: finalUser.toAuthJSON()}))
        .catch(err => res.status(400).json(err));
});

router.post('/login', auth.optional, async (req, res, next) => {
    return passport.authenticate('user', {session: false}, (err, passportUser, info) => {
        if (err) {
            return next(err);
        }

        if (passportUser) {
            const user = passportUser;
            user.token = passportUser.generateJWT();

            return res.status(200).json({user: user.toAuthJSON()});
        }

        return res.status(400).send('Email or Password Incorrect');
    })(req, res, next);
});

router.post('/exists', auth.optional, (req, res) => {
    User.find({email: req.body.email}).then((users) => {
        res.status(200).send(users);
    }).catch((e) => {
        res.status(400).send(e);
    })
});

router.get('/get/:id', auth.required, (req, res) => {
    User.findById(req.params.id).then((user) => {
        res.status(200).send(user);
    }).catch((e) => {
        res.status(400).send(e);
    })
});

router.post('/get/users', auth.required, (req, res) => {
    User.find({id: {$ne: req.body.userId}}).then((user) => {
        res.status(200).json(user);
    }).catch((e) => {
        res.status(400).send(e);
    });
});

router.patch('/patch', auth.required, (req, res) => {
    User.findOneAndUpdate({id: req.body.id}, req.body, {new: true}).then((user, err) => {
        if (err)
            return res.status(400).json({message: "Couldn't Patch User", error: err});
        return res.status(200).json(user);
    });
});

router.delete('/delete', auth.required, (req, res) => {

});

module.exports = router;
