const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');

let UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return validator.isEmail(v)
            },
            message: '{VALUE} is not a valid email'
        }
    },
    createdAt: {
        type: Date,
        default: moment.utc()
    },
    lastLoggedIn: {
        type: Date,
        default: moment.utc()
    },
    daysLoggedIn: {
        type: Number,
        default: 1
    },
    chips: {
        type: Number,
        default: 1000
    },
    rankClass: {
        type: String,
        default: 'Bronze'
    },
    rank: {
        type: Number,
        default: 0
    },
    totalWinnings: {
        type: Number,
        default: 0
    },
    friends: {
        type: [String],
        default: []
    },
    icon: {
        type: String,
        default: 'default'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    salt: {
        type: String,
        default: null
    },
    hash: {
        type: String,
        default: null
    }
});

UserSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.validatePassword = function (password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

UserSchema.methods.generateJWT = function () {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
        email: this.email,
        id: this.id,
        exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret');
};

UserSchema.methods.toAuthJSON = function () {
    return {
        id: this.id,
        email: this.email,
        token: this.generateJWT(),
    };
};

let User = mongoose.model('User', UserSchema);
module.exports = {User};
