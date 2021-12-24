const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    static associate(models) {
      this.belongsToMany(models.User, { as: 'participant', through: models.Participant, foreignKey: { allowNull: false, name: 'gameId' } });
      this.belongsTo(models.User, { as: 'owner', foreignKey: { allowNull: false, name: 'ownerId' } });
    }
  }
  Game.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM('setup', 'in progress', 'completed'),
      defaultValue: 'setup',
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  }, {
    sequelize,
    modelName: 'Game',
  });
  return Game;
};
