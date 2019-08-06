const passport = require('passport');
const LocalStrategy = require('passport-local');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const fs = require('fs');
const path = require('path');
const User = require('../models').User;

const publicKeyPath = path.join(__dirname, './public.key');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    algorithms: ['RS256'],
    secretOrKey: publicKey,
};

passport.use('jwt', new JwtStrategy(opts, (jwt_payload, done) => {
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
