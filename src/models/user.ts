import * as uuid from 'uuid';
import {
  Model, DataTypes, Sequelize, ModelStatic,
} from 'sequelize';
import bcrypt from 'bcrypt';
import { UserAttributes, UserCreationAttributes } from '../types/models';

const saltRounds = parseInt(process.env.PASSWORD_SALT_ROUNDS || '10', 10);

export default (sequelize: Sequelize) => {
  class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    declare id: string;

    declare firstName: string;

    declare lastName: string;

    declare email: string;

    declare password: string;

    declare active: boolean;

    declare kills: number;

    declare readonly createdAt: Date;

    declare readonly updatedAt: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, ModelStatic<any>>) {
      this.belongsToMany(models.Game, {
        through: models.GameUser,
        foreignKey: { allowNull: false, name: 'userId' },
        onDelete: 'cascade',
        hooks: true,
      });
      this.hasMany(models.Game, { as: 'gameOwned', foreignKey: { allowNull: false, name: 'ownerId' } });
      this.hasMany(models.Challenge, {
        foreignKey: { name: 'userId', allowNull: false },
        onDelete: 'cascade',
        hooks: true,
      });
    }

    checkPassword(password: string): Promise<boolean> {
      return bcrypt.compare(password, this.password);
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
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
