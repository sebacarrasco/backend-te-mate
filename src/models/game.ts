import {
  Model, DataTypes, Sequelize, ModelStatic,
} from 'sequelize';
import { GameAttributes, GameCreationAttributes } from '../types/models';

export default (sequelize: Sequelize) => {
  class Game extends Model<GameAttributes, GameCreationAttributes> implements GameAttributes {
    declare id: number;

    declare name: string;

    declare status: 'setup' | 'in progress' | 'completed';

    declare ownerId: string;

    declare readonly createdAt: Date;

    declare readonly updatedAt: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, ModelStatic<any>>) {
      this.belongsToMany(models.User, {
        as: 'participants',
        through: models.Participant,
        foreignKey: { allowNull: false, name: 'gameId' },
      });
      this.belongsTo(models.User, { as: 'owner', foreignKey: { allowNull: false, name: 'ownerId' } });
    }
  }

  Game.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
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
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Game',
  });

  return Game;
};
