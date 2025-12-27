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

// Participant
export interface ParticipantAttributes {
  id: number;
  userId: string;
  gameId: number;
  alive: boolean;
  kills: number;
  participantKillerId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ParticipantCreationAttributes = Optional<
  ParticipantAttributes,
  'id' | 'alive' | 'kills' | 'participantKillerId'
>;

// Challenge
export interface ChallengeAttributes {
  id: number;
  description: string;
  selected: boolean;
  userId: string;
  participantId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ChallengeCreationAttributes = Optional<ChallengeAttributes, 'id' | 'selected' | 'participantId'>;

export type UserModel = Model<UserAttributes> & UserAttributes & {
  checkPassword(password: string): Promise<boolean>;
  getGames(options?: object): Promise<GameModel[]>;
  toJSON(): UserAttributes;
  save(): Promise<void>;
  destroy(): Promise<void>;
};

export type GameModel = Model<GameAttributes> & GameAttributes & {
  addParticipants(users: UserModel[]): Promise<void>;
  participants?: UserModel[];
  toJSON(): GameAttributes & { participants?: GameParticipantWithAssociations[] };
  save(): Promise<void>;
  destroy(): Promise<void>;
};

export type GameUserModel = Model<GameUserAttributes> & GameUserAttributes & {
  save(): Promise<void>;
  destroy(): Promise<void>;
};

export type ParticipantModel = Model<ParticipantAttributes> & ParticipantAttributes & {
  setKiller(killerId: number): Promise<void>;
  save(): Promise<void>;
  destroy(): Promise<void>;
};

export type ChallengeModel = Model<ChallengeAttributes> & ChallengeAttributes & {
  setParticipant(participantId: number): Promise<void>;
  save(): Promise<void>;
  destroy(): Promise<void>;
};

export interface GameParticipantWithAssociations extends UserAttributes {
  Participant: ParticipantModel;
  Challenges: ChallengeModel[];
}

export interface GameWithParticipants extends GameAttributes {
  participants: GameParticipantWithAssociations[];
  owner?: UserModel;
  toJSON(): GameAttributes & { participants?: GameParticipantWithAssociations[] };
  save(): Promise<void>;
  destroy(): Promise<void>;
}

export interface EmailInfo {
  killer: GameParticipantWithAssociations;
  participant: GameParticipantWithAssociations;
  challengeDescription: string;
}

export type AssignChallengesResult = [boolean, EmailInfo[] | Record<string, never>];
