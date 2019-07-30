'use strict';

module.exports = (sequalize, DataTypes) => {
  const Metric = sequalize.define('Metric', {
    metricType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    botId: {
      type: DataTypes.INTEGER,
    }
  });

  Metric.references = models => {
    Metric.belongsTo(models.Bot, {
      as: 'metrics',
      onDelete: 'CASCADE',
      foreignKey: 'botId',
    });
  };

  return Metric;
};
