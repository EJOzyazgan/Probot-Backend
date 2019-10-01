'use strict';

module.exports = (sequalize, DataTypes) => {
  const Purchase = sequalize.define('Purchase', {
    paypalId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    payer: {
        type: DataTypes.JSON,
    },
    purchaseUnits: {
        type: DataTypes.ARRAY(DataTypes.JSON),
    },
    userId: {
      type: DataTypes.INTEGER,
    }
  });

  Purchase.references = models => {
    Purchase.belongsTo(models.User, {
      as: 'purchases',
      onDelete: 'CASCADE',
      foreignKey: 'userId',
    });
  };

  return Purchase;
};
