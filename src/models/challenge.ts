import {
  Model, DataTypes, Sequelize, ModelStatic,
} from 'sequelize';
import { ChallengeAttributes, ChallengeCreationAttributes } from '../types/models';

export default (sequelize: Sequelize) => {
  class Challenge extends Model<ChallengeAttributes, ChallengeCreationAttributes> implements ChallengeAttributes {
    declare id: number;

    declare description: string;

    declare selected: boolean;

    declare userId: string;

    declare readonly createdAt: Date;

    declare readonly updatedAt: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, ModelStatic<any>>) {
      this.belongsTo(models.User, { foreignKey: { allowNull: false, name: 'userId' } });
    }
  }

  Challenge.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Challenge',
  });

  return Challenge;
};
