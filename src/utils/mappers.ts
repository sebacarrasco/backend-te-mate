import { GameModel, GameUserModel, UserModel } from '../types/models';

const mapGameResponse = (game: GameModel, gameUser: GameUserModel, owner: UserModel) => ({
  id: game.id,
  name: game.name,
  status: game.status,
  ownerId: game.ownerId,
  owner: mapUserResponse(owner),
  createdAt: game.createdAt,
  updatedAt: game.updatedAt,
  isUserAlive: gameUser.isAlive,
});

const mapParticipantResponse = (user: UserModel, gameUser: GameUserModel, challengesNotSelected: number) => ({
  ...mapUserResponse(user),
  challengesNotSelected,
  gameUser: {
    isAlive: gameUser.isAlive,
    kills: gameUser.kills,
  },
});

const mapUserResponse = (user: UserModel) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  kills: user.kills,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  active: user.active,
});

export { mapGameResponse, mapParticipantResponse, mapUserResponse };
