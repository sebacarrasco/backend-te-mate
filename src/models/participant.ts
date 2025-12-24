import {
  Model, DataTypes, Sequelize, ModelStatic,
} from 'sequelize';
import { ParticipantAttributes, ParticipantCreationAttributes } from '../types/models';

export default (sequelize: Sequelize) => {
  class Participant
    extends Model<ParticipantAttributes, ParticipantCreationAttributes>
    implements ParticipantAttributes {
    declare id: number;

    declare userId: string;

    declare gameId: number;

    declare alive: boolean;

    declare kills: number;

    declare participantKillerId: number | null;

    declare readonly createdAt: Date;

    declare readonly updatedAt: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, ModelStatic<any>>) {
      this.hasOne(models.Challenge, {
        foreignKey: { name: 'participantId', allowNull: true },
        onDelete: 'cascade',
        hooks: true,
      });
      this.hasOne(
        models.Participant,
        {
          as: 'victim', foreignKey: { name: 'participantKillerId', allowNull: true }, onDelete: 'cascade', hooks: true,
        },
      );
      this.belongsTo(
        models.Participant,
        {
          as: 'Killer', foreignKey: { name: 'participantKillerId', allowNull: true }, onDelete: 'cascade', hooks: true,
        },
      );
    }
  }

  Participant.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
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
    participantKillerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Participant',
  });

  return Participant;
};
