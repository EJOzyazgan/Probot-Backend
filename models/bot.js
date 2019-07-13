'use strict';

module.exports = (sequalize, DataTypes) => {
  const Bot = sequalize.define('Bot', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {msg: 'Must provide name'}
      }
    },
    isSandboxBot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    serviceUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {msg: 'Must provide serviceUrl'},
        isUrl: {msg: 'Must provide valid URL'}
      }
    },
    tournaments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    handsPlayed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    handsWon: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalWinnings: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    lastPlayed: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    currentTable: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    tablesPlayed: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  Bot.associate = models => {
    Bot.belongsTo(models.User, {
      as: 'user',
      onDelete: 'CASCADE',
      foreignKey: 'userId'
    });
    Bot.hasMany(models.Metric, {
        as: 'metrics',
        onDelete: 'CASCADE',
        foreignKey: 'botId'
    });
  };

  return Bot;
};
