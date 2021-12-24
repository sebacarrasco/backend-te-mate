const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Challenge extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: { allowNull: false, name: 'userId' } });
      this.belongsTo(models.Participant, { foreignKey: { allowNull: true, name: 'participantId' } });
    }
  }
  Challenge.init({
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    selected: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'Challenge',
  });
  return Challenge;
};
