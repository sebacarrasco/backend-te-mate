import { Sequelize } from 'sequelize';
import {
  UserAttributes,
  UserModel,
  GameAttributes,
  GameModel,
  ParticipantAttributes,
  ParticipantModel,
  ChallengeAttributes,
  ChallengeModel,
  GameUserAttributes,
  GameUserModel,
  AssignedChallengeModel,
  AssignedChallengeAttributes,
} from './models';

// Destroy options including truncate options
interface ModelDestroyOptions {
  where?: object;
  truncate?: boolean;
  cascade?: boolean;
  force?: boolean;
}

// ORM type representing the models/index.js export
export interface ORM {
  User: {
    findOne(options?: object): Promise<UserModel | null>;
    findByPk(id: string, options?: object): Promise<UserModel | null>;
    findAll(options?: object): Promise<UserModel[]>;
    findOrCreate(options: object): Promise<[UserModel, boolean]>;
    create(values: Partial<UserAttributes>): Promise<UserModel>;
    destroy(options: ModelDestroyOptions): Promise<number>;
  };
  GameUser: {
    findOne(options?: object): Promise<GameUserModel | null>;
    findByPk(id: number, options?: object): Promise<GameUserModel | null>;
    findAll(options?: object): Promise<GameUserModel[]>;
    create(values: Partial<GameUserAttributes>): Promise<GameUserModel>;
    bulkCreate(values: Partial<GameUserAttributes>[]): Promise<GameUserModel[]>;
    destroy(options: ModelDestroyOptions): Promise<number>;
  };
  Game: {
    findOne(options?: object): Promise<GameModel | null>;
    findByPk(id: number | string, options?: object): Promise<GameModel | null>;
    findAll(options?: object): Promise<GameModel[]>;
    create(values: Partial<GameAttributes>): Promise<GameModel>;
    destroy(options: ModelDestroyOptions): Promise<number>;
  };
  Participant: {
    findOne(options?: object): Promise<ParticipantModel | null>;
    findByPk(id: number, options?: object): Promise<ParticipantModel | null>;
    findAll(options?: object): Promise<ParticipantModel[]>;
    create(values: Partial<ParticipantAttributes>): Promise<ParticipantModel>;
    destroy(options: ModelDestroyOptions): Promise<number>;
  };
  Challenge: {
    findOne(options?: object): Promise<ChallengeModel | null>;
    findByPk(id: number | string, options?: object): Promise<ChallengeModel | null>;
    findAll(options?: object): Promise<ChallengeModel[]>;
    create(values: Partial<ChallengeAttributes>): Promise<ChallengeModel>;
    destroy(options: ModelDestroyOptions): Promise<number>;
  };
  AssignedChallenge: {
    findOne(options?: object): Promise<AssignedChallengeModel | null>;
    findByPk(id: number, options?: object): Promise<AssignedChallengeModel | null>;
    findAll(options?: object): Promise<AssignedChallengeModel[]>;
    create(values: Partial<AssignedChallengeAttributes>): Promise<AssignedChallengeModel>;
    destroy(options: ModelDestroyOptions): Promise<number>;
  };
  sequelize: Sequelize;
  Sequelize: typeof import('sequelize');
}
