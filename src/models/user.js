const uuid = require('uuid');
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

const saltRounds = parseInt(process.env.PASSWORD_SALT_ROUNDS, 10);

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.belongsToMany(models.Game, {
        through: models.Participant,
        foreignKey: { allowNull: false, name: 'userId' },
        onDelete: 'cascade',
        hooks: true,
      });
      this.hasMany(models.Game, { as: 'gameOwned', foreignKey: { allowNull: false, name: 'ownerId' } });
      this.hasMany(models.Challenge, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'cascade', hooks: true });
    }

    checkPassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }
  User.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    kills: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  User.beforeCreate((user) => {
    user.id = uuid.v4();
  });
  User.beforeSave(async (instance) => {
    if (instance.changed('password')) {
      const hash = await bcrypt.hash(instance.password, saltRounds);
      instance.set('password', hash);
    }
  });
  return User;
};
