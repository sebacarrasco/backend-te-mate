import { Sequelize, ModelStatic } from 'sequelize';
import config from '../config/database';
import { ORM } from '../types/orm';

import userFactory from './user';
import gameFactory from './game';
import participantFactory from './participant';
import challengeFactory from './challenge';
import gameUserFactory from './game-user';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelizeConfig = dbConfig.use_env_variable
  ? process.env[dbConfig.use_env_variable]
  : dbConfig;

const sequelize = new Sequelize(sequelizeConfig as string);

// Initialize models
const User = userFactory(sequelize);
const Game = gameFactory(sequelize);
const GameUser = gameUserFactory(sequelize);
const Participant = participantFactory(sequelize);
const Challenge = challengeFactory(sequelize);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const models: Record<string, ModelStatic<any>> = {
  User,
  Game,
  GameUser,
  Participant,
  Challenge,
};

// Set up associations
Object.values(models).forEach((model) => {
  if ('associate' in model && typeof (model as { associate?: unknown }).associate === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (model as any).associate(models);
  }
});

// Type assertion needed because the ORM interface describes runtime behavior
const orm = {
  sequelize,
  Sequelize,
  User,
  Game,
  GameUser,
  Participant,
  Challenge,
} as unknown as ORM;

export {
  sequelize, Sequelize, User, Game, GameUser, Participant, Challenge,
};
export default orm;
