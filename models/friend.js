'use strict';

module.exports = (sequalize, DataTypes) => {
  const Friend = sequalize.define('Friend', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    friendId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  Friend.associate = models => {
    Friend.belongsTo(models.User, {
      as: 'friends',
      onDelete: 'CASCADE',
      foreignKey: 'userId'
    });
  };

  return Friend;
};
