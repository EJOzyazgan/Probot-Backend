'use strict';

module.exports = (sequalize, DataTypes) => {
  const Queue = sequalize.define('Queue', {
    botId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tableId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  return Queue;
};
