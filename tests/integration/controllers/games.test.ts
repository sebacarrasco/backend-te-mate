import request from 'supertest';
import { Op } from 'sequelize';
import sendgridMail from '@sendgrid/mail';
import {
  describe, it, expect, beforeAll, beforeEach, jest,
} from '@jest/globals';
import { createApp, orm } from '../../helpers/app';
import { generateToken } from '../../../src/utils/jwt';
import {
  AssignedChallengeModel,
  ChallengeModel,
  GameModel,
  GameUserModel,
  UserModel,
} from '../../../src/types';
import { SuperTestResponse } from '../../types';

describe('GET /games', () => {
  let app: ReturnType<typeof createApp>;
  let currentUser: UserModel;
  let otherUser: UserModel;
  let authToken: string;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.Game.destroy({ where: {}, truncate: true, cascade: true });
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });
    await orm.GameUser.destroy({ where: {}, truncate: true, cascade: true });

    currentUser = await orm.User.create({
      firstName: 'Current',
      lastName: 'User',
      email: 'current@example.com',
      password: 'password123',
      active: true,
    });

    otherUser = await orm.User.create({
      firstName: 'Other',
      lastName: 'User',
      email: 'other@example.com',
      password: 'password123',
      active: true,
    });

    authToken = generateToken(currentUser.id);
  });

  describe('with valid authentication', () => {
    it('should return 200 with list of games for current user', async () => {
      const game = await orm.Game.create({
        name: 'Test Game',
        status: 'setup',
        ownerId: currentUser.id,
      });

      await orm.GameUser.create({
        gameId: game.id,
        userId: currentUser.id,
        isAlive: true,
      });

      const response: SuperTestResponse<
        { games: (GameModel & { isUserAlive: boolean; owner: UserModel })[] }
      > = await request(app)
        .get('/games')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.games).toBeDefined();
      expect(response.body.games).toHaveLength(1);
      expect(response.body.games[0].name).toBe('Test Game');
      expect(response.body.games[0].ownerId).toBe(currentUser.id);
      expect(response.body.games[0].isUserAlive).toBe(true);
      expect(response.body.games[0].owner.firstName).toBe('Current');
      expect(response.body.games[0].owner.lastName).toBe('User');
      expect(response.body.games[0].owner.email).toBe('current@example.com');
    });

    it('should return empty array when user has no games', async () => {
      const response: SuperTestResponse<
        { games: (GameModel & { isUserAlive: boolean; owner: UserModel })[] }
      > = await request(app)
        .get('/games')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.games).toBeDefined();
      expect(response.body.games).toHaveLength(0);
    });

    it('should not return games from other users', async () => {
      const game = await orm.Game.create({
        name: 'Other User Game',
        status: 'setup',
        ownerId: otherUser.id,
      });

      await orm.GameUser.create({
        gameId: game.id,
        userId: otherUser.id,
        isAlive: true,
      });

      const response: SuperTestResponse<
        { games: (GameModel & { isUserAlive: boolean; owner: UserModel })[] }
      > = await request(app)
        .get('/games')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.games).toHaveLength(0);
    });

    it('should return games where user is participant but not owner', async () => {
      const game = await orm.Game.create({
        name: 'Game Owned By Other',
        status: 'setup',
        ownerId: otherUser.id,
      });

      await orm.GameUser.create({
        gameId: game.id,
        userId: otherUser.id,
        isAlive: true,
      });

      await orm.GameUser.create({
        gameId: game.id,
        userId: currentUser.id,
        isAlive: true,
      });

      const response: SuperTestResponse<
        { games: (GameModel & { isUserAlive: boolean; owner: UserModel })[] }
      > = await request(app)
        .get('/games')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.games).toHaveLength(1);
      expect(response.body.games[0].name).toBe('Game Owned By Other');
      expect(response.body.games[0].isUserAlive).toBe(true);
      expect(response.body.games[0].owner.firstName).toBe('Other');
      expect(response.body.games[0].owner.lastName).toBe('User');
      expect(response.body.games[0].owner.email).toBe('other@example.com');
      expect(response.body.games[0].ownerId).toBe(otherUser.id);
    });
  });

  describe('without authentication', () => {
    it('should return 401', async () => {
      const response = await request(app).get('/games');

      expect(response.status).toBe(401);
    });
  });
});

describe('GET /games/:gameId', () => {
  let app: ReturnType<typeof createApp>;
  let currentUser: UserModel;
  let otherUser: UserModel;
  let authToken: string;
  let game: GameModel;
  let challengeForCurrentUser: ChallengeModel;
  let challengeForOtherUser: ChallengeModel;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.Challenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.GameUser.destroy({ where: {}, truncate: true, cascade: true });
    await orm.Game.destroy({ where: {}, truncate: true, cascade: true });
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });
    await orm.AssignedChallenge.destroy({ where: {}, truncate: true, cascade: true });

    currentUser = await orm.User.create({
      firstName: 'Current',
      lastName: 'User',
      email: 'current@example.com',
      password: 'password123',
      active: true,
    });

    otherUser = await orm.User.create({
      firstName: 'Other',
      lastName: 'User',
      email: 'other@example.com',
      password: 'password123',
      active: true,
    });

    game = await orm.Game.create({
      name: 'Test Game',
      status: 'setup',
      ownerId: currentUser.id,
    });

    await orm.GameUser.create({
      gameId: game.id,
      userId: currentUser.id,
      isAlive: true,
    });

    await orm.GameUser.create({
      gameId: game.id,
      userId: otherUser.id,
      isAlive: true,
    });

    challengeForCurrentUser = await orm.Challenge.create({
      userId: currentUser.id,
      description: 'Challenge for current user',
      selected: false,
    });

    challengeForOtherUser = await orm.Challenge.create({
      userId: otherUser.id,
      description: 'Challenge for other user',
      selected: false,
    });

    authToken = generateToken(currentUser.id);
  });

  describe('with valid request', () => {
    it('should return 200 with game details for setup status', async () => {
      const response: SuperTestResponse<
        { game: GameModel & {
          isUserAlive: boolean; owner: UserModel;
          participants: (UserModel & { challengesNotSelected: number; gameUser: GameUserModel })[];
          victim: UserModel | null;
          challenge: ChallengeModel | null;
        } }
      > = await request(app)
        .get(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.game).toBeDefined();
      expect(response.body.game.id).toBe(game.id);
      expect(response.body.game.name).toBe('Test Game');
      expect(response.body.game.status).toBe('setup');
      expect(response.body.game.ownerId).toBe(currentUser.id);
      expect(response.body.game.isUserAlive).toBe(true);
      expect(response.body.game.owner.firstName).toBe('Current');
      expect(response.body.game.owner.lastName).toBe('User');
      expect(response.body.game.owner.email).toBe('current@example.com');

      expect(response.body.game.participants).toBeDefined();
      expect(response.body.game.participants).toHaveLength(2);
      response.body.game.participants.forEach((
        participant: UserModel & { challengesNotSelected: number; gameUser: GameUserModel },
      ) => {
        expect(participant).toHaveProperty('id');
        expect(participant).toHaveProperty('firstName');
        expect(participant).toHaveProperty('lastName');
        expect(participant).toHaveProperty('email');
        expect(participant.challengesNotSelected).toBe(1);
        expect(participant.gameUser.isAlive).toBe(true);
        expect(participant.gameUser.kills).toBe(0);
        expect(participant.password).toBeUndefined();
      });

      // victim and challenge are undefined when game is in 'setup' status
      expect(response.body.game.victim).toBeNull();
      expect(response.body.game.challenge).toBeNull();
    });

    it('should include victim and challenge when game is in progress', async () => {
      // Update game status to 'in progress'
      await game.update({ status: 'in progress' });

      await orm.AssignedChallenge.create({
        gameId: game.id,
        killerId: currentUser.id,
        victimId: otherUser.id,
        challengeId: challengeForOtherUser.id,
      });

      await orm.AssignedChallenge.create({
        gameId: game.id,
        killerId: otherUser.id,
        victimId: currentUser.id,
        challengeId: challengeForCurrentUser.id,
      });

      await orm.Challenge.update({
        selected: true,
      }, {
        where: {
          id: [challengeForOtherUser.id, challengeForCurrentUser.id],
        },
      });

      const response: SuperTestResponse<
        { game: GameModel & {
          isUserAlive: boolean; owner: UserModel;
          participants: (UserModel & { challengesNotSelected: number; gameUser: GameUserModel })[];
          victim: UserModel;
          challenge: ChallengeModel;
        } }
      > = await request(app)
        .get(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.game.status).toBe('in progress');

      response.body.game.participants.forEach((
        participant: UserModel & { challengesNotSelected: number; gameUser: GameUserModel },
      ) => {
        expect(participant.challengesNotSelected).toBe(0);
      });

      expect(response.body.game.victim).toBeDefined();
      expect(response.body.game.victim.id).toBe(otherUser.id);
      expect(response.body.game.victim.firstName).toBe('Other');
      expect(response.body.game.victim.lastName).toBe('User');
      expect(response.body.game.victim.email).toBe('other@example.com');

      expect(response.body.game.challenge).toBeDefined();
      expect(response.body.game.challenge.description).toBe('Challenge for other user');
    });
  });

  describe('when game is not found', () => {
    it('should return 404', async () => {
      const response: SuperTestResponse<{ message: string }> = await request(app)
        .get('/games/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Game not found');
    });
  });

  describe('when user is not part of the game', () => {
    it('should return 401', async () => {
      const excludedUser = await orm.User.create({
        firstName: 'Non',
        lastName: 'Participant',
        email: 'nonparticipant@example.com',
        password: 'password123',
        active: true,
      });

      const nonParticipantToken = generateToken(excludedUser.id);

      const response: SuperTestResponse<{ message: string }> = await request(app)
        .get(`/games/${game.id}`)
        .set('Authorization', `Bearer ${nonParticipantToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('You are not part of this game');
    });
  });

  describe('without authentication', () => {
    it('should return 401', async () => {
      const response = await request(app).get(`/games/${game.id}`);

      expect(response.status).toBe(401);
    });
  });
});

describe('POST /games', () => {
  let app: ReturnType<typeof createApp>;
  let currentUser: UserModel;
  let participant1: UserModel;
  let participant2: UserModel;
  let authToken: string;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.Challenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.GameUser.destroy({ where: {}, truncate: true, cascade: true });
    await orm.Game.destroy({ where: {}, truncate: true, cascade: true });
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });

    currentUser = await orm.User.create({
      firstName: 'Current',
      lastName: 'User',
      email: 'current@example.com',
      password: 'password123',
      active: true,
    });

    participant1 = await orm.User.create({
      firstName: 'Participant',
      lastName: 'One',
      email: 'participant1@example.com',
      password: 'password123',
      active: true,
    });

    participant2 = await orm.User.create({
      firstName: 'Participant',
      lastName: 'Two',
      email: 'participant2@example.com',
      password: 'password123',
      active: true,
    });

    authToken = generateToken(currentUser.id);
  });

  describe('with valid request', () => {
    it('should return 201 and create a game with participants', async () => {
      const response: SuperTestResponse<{
        game: GameModel & { isUserAlive: boolean; owner: UserModel };
      }> = await request(app)
        .post('/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Game',
          userIds: [participant1.id, participant2.id],
        });

      expect(response.status).toBe(201);
      expect(response.body.game).toBeDefined();
      expect(response.body.game.id).toBeDefined();
      expect(response.body.game.name).toBe('New Game');
      expect(response.body.game.ownerId).toBe(currentUser.id);
      expect(response.body.game.status).toBe('setup');
      expect(response.body.game.isUserAlive).toBe(true);
      expect(response.body.game.owner.firstName).toBe('Current');
      expect(response.body.game.owner.lastName).toBe('User');
      expect(response.body.game.owner.email).toBe('current@example.com');

      // Verify game users were created in the database
      const gameUsers = await orm.GameUser.findAll({
        where: { gameId: response.body.game.id },
      });
      expect(gameUsers).toHaveLength(3); // currentUser + 2 participants
    });
  });

  describe('with validation errors', () => {
    it('should return 400 when name is too short', async () => {
      const response: SuperTestResponse<{
        errors: { name: string }[];
      }> = await request(app)
        .post('/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'A',
          userIds: [participant1.id, participant2.id],
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('when not enough participants', () => {
    it('should return 406 when less than 2 userIds provided', async () => {
      const response: SuperTestResponse<{ message: string }> = await request(app)
        .post('/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Game',
          userIds: [participant1.id],
        });

      expect(response.status).toBe(406);
      expect(response.body.message).toBe('There should be at least 2 other participants');
    });
  });

  describe('when user is not found', () => {
    it('should return 404 when a userIds does not exist', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      const response: SuperTestResponse<{ message: string }> = await request(app)
        .post('/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Game',
          userIds: [participant1.id, fakeUserId],
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Not every user was found');
    });

    it('should return 404 when a user is inactive', async () => {
      const inactiveUser = await orm.User.create({
        firstName: 'Inactive',
        lastName: 'User',
        email: 'inactive@example.com',
        password: 'password123',
        active: false,
      });

      const response: SuperTestResponse<{ message: string }> = await request(app)
        .post('/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Game',
          userIds: [participant1.id, inactiveUser.id],
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Not every user was found');
    });
  });

  describe('without authentication', () => {
    it('should return 401', async () => {
      const response = await request(app)
        .post('/games')
        .send({
          name: 'New Game',
          userIds: [participant1.id, participant2.id],
        });

      expect(response.status).toBe(401);
    });
  });
});

describe('PATCH /games/:gameId', () => {
  let app: ReturnType<typeof createApp>;
  let currentUser: UserModel;
  let otherUser: UserModel;
  let authToken: string;
  let game: GameModel;
  let sendGridSpy: jest.SpiedFunction<typeof sendgridMail.send>;

  beforeAll(() => {
    app = createApp();
    sendGridSpy = jest.spyOn(sendgridMail, 'send').mockResolvedValue({} as never);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    await orm.AssignedChallenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.Challenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.GameUser.destroy({ where: {}, truncate: true, cascade: true });
    await orm.Game.destroy({ where: {}, truncate: true, cascade: true });
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });

    currentUser = await orm.User.create({
      firstName: 'Current',
      lastName: 'User',
      email: 'current@example.com',
      password: 'password123',
      active: true,
    });

    otherUser = await orm.User.create({
      firstName: 'Other',
      lastName: 'User',
      email: 'other@example.com',
      password: 'password123',
      active: true,
    });

    game = await orm.Game.create({
      name: 'Test Game',
      status: 'setup',
      ownerId: currentUser.id,
    });

    await orm.GameUser.create({ gameId: game.id, userId: currentUser.id });
    await orm.GameUser.create({ gameId: game.id, userId: otherUser.id });

    await orm.Challenge.create({
      userId: currentUser.id,
      description: 'Challenge for current user',
      selected: false,
    });
    await orm.Challenge.create({
      userId: otherUser.id,
      description: 'Challenge for other user',
      selected: false,
    });

    authToken = generateToken(currentUser.id);
  });

  describe('when updating game name', () => {
    it('should return 200 and update the name without sending emails', async () => {
      const response: SuperTestResponse<{
        game: GameModel & { isUserAlive: boolean; owner: UserModel };
      }> = await request(app)
        .patch(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Game Name' });

      expect(response.status).toBe(200);
      expect(response.body.game.name).toBe('Updated Game Name');

      // Verify in database
      const updatedGame = await orm.Game.findByPk(game.id);
      expect(updatedGame!.name).toBe('Updated Game Name');

      // Verify no emails were sent (only sent when starting game)
      expect(sendGridSpy).not.toHaveBeenCalled();
    });
  });

  describe('when starting the game (setup -> in progress)', () => {
    beforeEach(async () => {
      // Create challenges for game users - each needs at least 2
      const gameUsers = await orm.GameUser.findAll({
        where: { gameId: game.id },
        attributes: ['userId'],
      });

      await Promise.all(gameUsers.flatMap((gameUser: GameUserModel) => [
        orm.Challenge.create({
          userId: gameUser.userId,
          description: 'Challenge 1',
          selected: false,
        }),
        orm.Challenge.create({
          userId: gameUser.userId,
          description: 'Challenge 2',
          selected: false,
        }),
      ]));
    });

    it('should return 200, create assigned challenges, and send emails', async () => {
      const response: SuperTestResponse<{
        game: GameModel & { isUserAlive: boolean; owner: UserModel };
      }> = await request(app)
        .patch(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in progress' });

      expect(response.status).toBe(200);
      expect(response.body.game.status).toBe('in progress');
      expect(response.body.game.id).toBe(game.id);
      expect(response.body.game.name).toBe('Test Game');
      expect(response.body.game.ownerId).toBe(currentUser.id);
      expect(response.body.game.isUserAlive).toBe(true);
      expect(response.body.game.owner.firstName).toBe('Current');
      expect(response.body.game.owner.lastName).toBe('User');
      expect(response.body.game.owner.email).toBe('current@example.com');
      expect(response.body.game.isUserAlive).toBe(true);

      // Verify game status in database
      const updatedGame = await orm.Game.findByPk(game.id);
      expect(updatedGame!.status).toBe('in progress');

      // Verify assigned challenges were created (one per game user)
      const assignedChallenges = await orm.AssignedChallenge.findAll({
        where: { gameId: game.id },
      });
      expect(assignedChallenges).toHaveLength(2);

      // Verify each user is assigned as killer to exactly one other user
      const killerIds = assignedChallenges.map((ac: AssignedChallengeModel) => ac.killerId);
      const victimIds = assignedChallenges.map((ac: AssignedChallengeModel) => ac.victimId);
      const gameUserIds = [currentUser.id, otherUser.id];

      killerIds.forEach((killerId: string) => {
        expect(gameUserIds).toContain(killerId);
      });
      victimIds.forEach((victimId: string) => {
        expect(gameUserIds).toContain(victimId);
      });

      // Verify killer is not their own victim
      assignedChallenges.forEach((ac: AssignedChallengeModel) => {
        expect(ac.killerId).not.toBe(ac.victimId);
      });

      // Verify challenges were selected (one per user should be selected)
      const selectedChallenges = await orm.Challenge.findAll({
        where: { selected: true },
      });
      expect(selectedChallenges).toHaveLength(2);

      // Verify emails were sent (one per user)
      expect(sendGridSpy).toHaveBeenCalledTimes(2);
    });

    it('should return 406 when participants do not have enough challenges', async () => {
      // Remove the extra challenges created in nested beforeEach, leaving only 1 per user
      await orm.Challenge.destroy({
        where: { description: { [Op.like]: 'Challenge 1' } },
      });
      await orm.Challenge.destroy({
        where: { description: { [Op.like]: 'Challenge 2' } },
      });

      const response: SuperTestResponse<{ message: string }> = await request(app)
        .patch(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in progress' });

      expect(response.status).toBe(406);
      expect(response.body.message).toBe('Not every participant has 2 or more challenges');
    });
  });

  describe('when user is not the owner', () => {
    it('should return 403', async () => {
      const otherUserToken = generateToken(otherUser.id);

      const response: SuperTestResponse<{ message: string }> = await request(app)
        .patch(`/games/${game.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ name: 'Hacked Name' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied: you cannot modify a game unless you own it');
    });
  });

  describe('when game is not found', () => {
    it('should return 404', async () => {
      const response: SuperTestResponse<{ message: string }> = await request(app)
        .patch('/games/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Game not found');
    });
  });

  describe('with validation errors', () => {
    it('should return 400 when name is too short', async () => {
      const response: SuperTestResponse<{ errors: { name: { msg: string } } }> = await request(app)
        .patch(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'A' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.name.msg).toContain('name');
    });

    it('should return 400 when status is invalid', async () => {
      const response: SuperTestResponse<{ errors: { name: { msg: string } } }> = await request(app)
        .patch(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.name.msg).toContain('status');
    });
  });

  describe('without authentication', () => {
    it('should return 401', async () => {
      const response = await request(app)
        .patch(`/games/${game.id}`)
        .send({ name: 'New Name' });

      expect(response.status).toBe(401);
    });
  });
});

describe('DELETE /games/:gameId', () => {
  let app: ReturnType<typeof createApp>;
  let currentUser: UserModel;
  let otherUser: UserModel;
  let authToken: string;
  let game: GameModel;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.Challenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.GameUser.destroy({ where: {}, truncate: true, cascade: true });
    await orm.Game.destroy({ where: {}, truncate: true, cascade: true });
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });

    currentUser = await orm.User.create({
      firstName: 'Current',
      lastName: 'User',
      email: 'current@example.com',
      password: 'password123',
      active: true,
    });

    otherUser = await orm.User.create({
      firstName: 'Other',
      lastName: 'User',
      email: 'other@example.com',
      password: 'password123',
      active: true,
    });

    game = await orm.Game.create({
      name: 'Test Game',
      status: 'setup',
      ownerId: currentUser.id,
    });

    await orm.GameUser.create({ gameId: game.id, userId: currentUser.id });
    await orm.GameUser.create({ gameId: game.id, userId: otherUser.id });

    // Create challenges (required by findGame middleware)
    const challengeForCurrentUser = await orm.Challenge.create({
      userId: currentUser.id,
      description: 'Challenge 1',
      selected: true,
    });
    const challengeForOtherUser = await orm.Challenge.create({
      userId: otherUser.id,
      description: 'Challenge 2',
      selected: true,
    });

    await orm.AssignedChallenge.create({
      gameId: game.id,
      killerId: currentUser.id,
      victimId: otherUser.id,
      challengeId: challengeForCurrentUser.id,
    });
    await orm.AssignedChallenge.create({
      gameId: game.id,
      killerId: otherUser.id,
      victimId: currentUser.id,
      challengeId: challengeForOtherUser.id,
    });

    authToken = generateToken(currentUser.id);
  });

  describe('with valid request', () => {
    it('should return 204 and delete the game', async () => {
      const response = await request(app)
        .delete(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify game is deleted from database
      const deletedGame = await orm.Game.findByPk(game.id);
      expect(deletedGame).toBeNull();

      // Verify assigned challenges are deleted
      const assignedChallenges = await orm.AssignedChallenge.findAll({
        where: { gameId: game.id },
      });
      expect(assignedChallenges).toHaveLength(0);

      // Verify game users are deleted
      const gameUsers = await orm.GameUser.findAll({
        where: { gameId: game.id },
      });
      expect(gameUsers).toHaveLength(0);
    });
  });

  describe('when user is not the owner', () => {
    it('should return 403', async () => {
      const otherUserToken = generateToken(otherUser.id);

      const response: SuperTestResponse<{ message: string }> = await request(app)
        .delete(`/games/${game.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied: you cannot modify a game unless you own it');

      // Verify game was NOT deleted
      const existingGame = await orm.Game.findByPk(game.id);
      expect(existingGame).not.toBeNull();
    });
  });

  describe('when game is not found', () => {
    it('should return 404', async () => {
      const response: SuperTestResponse<{ message: string }> = await request(app)
        .delete('/games/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Game not found');
    });
  });

  describe('without authentication', () => {
    it('should return 401', async () => {
      const response = await request(app)
        .delete(`/games/${game.id}`);

      expect(response.status).toBe(401);
    });
  });
});
