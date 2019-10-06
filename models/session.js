'use strict';

module.exports = (sequalize, DataTypes) => {
  const Session = sequalize.define('Session', {
    botId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tableType: {
      type: DataTypes.STRING,
      defaultValue: 'sandbox'
    },
    endedAt: {
      type: DataTypes.DATE,
      default: null,
    },
  });

  Session.associate = models => {
    Session.hasMany(models.SessionUpdates, {
      as: 'sessionUpdates',
      onDelete: 'CASCADE',
      foreignKey: 'sessionId'
    });
  };

  return Session;
};
