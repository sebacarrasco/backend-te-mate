import { Model, Optional } from 'sequelize';

// User
export interface UserAttributes {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  active: boolean;
  kills: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'active' | 'kills'>;

// Game
export interface GameAttributes {
  id: number;
  name: string;
  status: 'setup' | 'in progress' | 'completed';
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type GameCreationAttributes = Optional<GameAttributes, 'id' | 'status'>;

// GameUser
export interface GameUserAttributes {
  id: number;
  gameId: number;
  userId: string;
  isAlive: boolean;
  kills: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type GameUserCreationAttributes = Optional<GameUserAttributes, 'id' | 'isAlive' | 'kills'>;

// Challenge
export interface ChallengeAttributes {
  id: number;
  description: string;
  selected: boolean;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ChallengeCreationAttributes = Optional<ChallengeAttributes, 'id' | 'selected'>;

// AssignedChallenge
export interface AssignedChallengeAttributes {
  id: number;
  gameId: number;
  killerId: string;
  victimId: string;
  challengeId: number;
  isCompleted: boolean;
  isCancelled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type AssignedChallengeCreationAttributes = Optional<
  AssignedChallengeAttributes,
  'id' | 'isCompleted' | 'isCancelled' | 'deletedAt'
>;

export type UserModel = Model<UserAttributes> & UserAttributes & {
  checkPassword(password: string): Promise<boolean>;
  getGames(options?: object): Promise<GameModel[]>;
  toJSON(): UserAttributes;
  save(): Promise<void>;
  destroy(): Promise<void>;
};

export type GameModel = Model<GameAttributes> & GameAttributes & {
  save(): Promise<void>;
  destroy(): Promise<void>;
};

export type GameUserModel = Model<GameUserAttributes> & GameUserAttributes & {
  save(): Promise<void>;
  destroy(): Promise<void>;
};

export type ChallengeModel = Model<ChallengeAttributes> & ChallengeAttributes & {
  save(): Promise<void>;
  destroy(): Promise<void>;
};

export type AssignedChallengeModel = Model<AssignedChallengeAttributes> & AssignedChallengeAttributes & {
  save(): Promise<void>;
  destroy(): Promise<void>;
};

export interface EmailInfo {
  killer: UserModel;
  victim: UserModel;
  challengeDescription: string;
}

export type AssignChallengesResult = EmailInfo[];
