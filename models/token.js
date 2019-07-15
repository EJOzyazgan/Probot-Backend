'use strict';

module.exports = (sequalize, DataTypes) => {
  const Token = sequalize.define('Token', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tokenExpires: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  return Token;
};
