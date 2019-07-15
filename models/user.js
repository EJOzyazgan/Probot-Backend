'use strict';

const bcrypt = require('bcrypt');
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
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLoggedIn: {
      type: DataTypes.DATE,
      defaultValue: moment.utc()
    },
    daysLoggedIn: {
      type: DataTypes.INTEGER,
      defaultValue: 1
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
    friends: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    icon: {
      type: DataTypes.STRING,
      defaultValue: 'default'
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    User.hasMany(models.Bot, {
      as: 'bots',
      onDelete: 'CASCADE',
      foreignKey: 'userId'
    });
  };

  return User;
};
