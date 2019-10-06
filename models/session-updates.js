'use strict';

module.exports = (sequalize, DataTypes) => {
  const SessionUpdates = sequalize.define('SessionUpdates', {
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    updateId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  SessionUpdates.associate = models => {
    SessionUpdates.belongsTo(models.Session, {
      as: 'sessionUpdates',
      onDelete: 'CASCADE',
      foreignKey: 'sessionId'
    });
  };

  return SessionUpdates;
};