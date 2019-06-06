const passport = require('passport');
const LocalStrategy = require('passport-local');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const User = require('../models').User;

passport.use('user', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
}, (email, password, done) => {
    User.findOne({email: email})
        .then((user) => {
            if (!user || !user.validatePassword(password)) {
                return done(null, false, {errors: {'email or password': 'is invalid'}});
            }

            return done(null, user);
        }).catch(done);
}));

let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWTSecretKey;
passport.use('jwt', new JwtStrategy(opts, function (jwt_payload, done) {
    User.findOne({
        where: {
            id: jwt_payload.id
        }
    }).then((user, err) => {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
            // or you could create a new account
        }
    });
}));
