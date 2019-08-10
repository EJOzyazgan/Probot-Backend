'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const moment = require('moment');

module.exports = (sequalize, DataTypes) => {
  const User = sequalize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {msg: 'Must provide email'},
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {msg: 'Must provide password'}
      }
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: moment(),
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLoggedIn: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    daysLoggedIn: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    firstLoggedIn: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    referralCode: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    referredBy: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    referrals: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    chips: {
      type: DataTypes.FLOAT,
      defaultValue: 1000
    },
    rankClass: {
      type: DataTypes.STRING,
      defaultValue: 'Bronze'
    },
    rank: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    icon: {
      type: DataTypes.STRING,
      defaultValue: 'default'
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    refreshToken: {
      type: DataTypes.STRING,
      defaultValue: null
    }
  });

  User.beforeSave((user, options) => {
    if (user.changed('password')) {
      console.log(user.password);
      user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10), null);
    }
  });

  User.prototype.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
      if (err) {
        return cb(err);
      }
      cb(null, isMatch);
    });
  };

  User.associate = models => {
    User.hasMany(models.Friend, {
      as: 'friends',
      onDelete: 'CASCADE',
      foreignKey: 'userId'
    });
  };

  User.references = models => {
    User.hasOne(models.Bot, {
      as: 'bot',
      onDelete: 'CASCADE',
      foreignKey: 'userId'
    });
  };

  return User;
};
