const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Participant extends Model {
    static associate(models) {
      this.hasOne(models.Challenge, { foreignKey: { name: 'participantId', allowNull: true }, onDelete: 'cascade', hooks: true });
    }
  }
  Participant.init({
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    alive: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    kills: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'Participant',
  });
  return Participant;
};
