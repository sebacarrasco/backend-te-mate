import {
  Model, Sequelize, DataTypes, ModelStatic,
} from 'sequelize';
import { GameUserAttributes, GameUserCreationAttributes } from '../types/models';

export default (sequelize: Sequelize) => {
  class GameUser extends Model<GameUserAttributes, GameUserCreationAttributes> implements GameUserAttributes {
    declare id: number;

    declare gameId: number;

    declare userId: string;

    declare isAlive: boolean;

    declare kills: number;

    declare readonly createdAt: Date;

    declare readonly updatedAt: Date;

    declare deletedAt?: Date | null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, ModelStatic<any>>) {
      this.belongsTo(models.Game, { foreignKey: { allowNull: false, name: 'gameId' } });
      this.belongsTo(models.User, { foreignKey: { allowNull: false, name: 'userId' } });
    }
  }
  GameUser.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isAlive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    kills: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'GameUser',
  });
  return GameUser;
};
