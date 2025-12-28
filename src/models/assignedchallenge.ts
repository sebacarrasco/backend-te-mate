import {
  Model, Sequelize, DataTypes, ModelStatic,
} from 'sequelize';
import { AssignedChallengeAttributes, AssignedChallengeCreationAttributes } from '../types/models';

export default (sequelize: Sequelize) => {
  class AssignedChallenge
    extends Model<AssignedChallengeAttributes, AssignedChallengeCreationAttributes>
    implements AssignedChallengeAttributes {
    declare id: number;

    declare gameId: number;

    declare killerId: string;

    declare victimId: string;

    declare challengeId: number;

    declare isCompleted: boolean;

    declare isCancelled: boolean;

    declare readonly createdAt: Date;

    declare readonly updatedAt: Date;

    declare deletedAt?: Date | null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, ModelStatic<any>>) {
      this.belongsTo(models.Game, { foreignKey: { allowNull: false, name: 'gameId' } });
      this.belongsTo(models.User, { foreignKey: { allowNull: false, name: 'killerId' } });
      this.belongsTo(models.User, { foreignKey: { allowNull: false, name: 'victimId' } });
      this.belongsTo(models.Challenge, { foreignKey: { allowNull: false, name: 'challengeId' } });
    }
  }
  AssignedChallenge.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    killerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    victimId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    challengeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isCancelled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'AssignedChallenge',
  });

  return AssignedChallenge;
};
