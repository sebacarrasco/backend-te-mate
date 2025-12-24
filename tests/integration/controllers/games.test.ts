import request from 'supertest';
import { Op } from 'sequelize';
import sendgridMail from '@sendgrid/mail';
import { createApp, orm } from '../../helpers/app';
import { generateToken } from '../../../src/utils/jwt';

describe('GET /games', () => {
  let app: ReturnType<typeof createApp>;
  let currentUser: any;
  let otherUser: any;
  let authToken: string;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.Participant.destroy({ where: {}, truncate: true, cascade: true });
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

    authToken = generateToken(currentUser.id);
  });

  describe('with valid authentication', () => {
    it('should return 200 with list of games for current user', async () => {
      const game = await orm.Game.create({
        name: 'Test Game',
        status: 'setup',
        ownerId: currentUser.id,
      });

      await orm.Participant.create({
        gameId: game.id,
        userId: currentUser.id,
      });

      const response = await request(app)
        .get('/games')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.games).toBeDefined();
      expect(response.body.games).toHaveLength(1);
      expect(response.body.games[0].name).toBe('Test Game');
    });

    it('should return empty array when user has no games', async () => {
      const response = await request(app)
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

      await orm.Participant.create({
        gameId: game.id,
        userId: otherUser.id,
      });

      const response = await request(app)
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

      await orm.Participant.create({
        gameId: game.id,
        userId: otherUser.id,
      });

      await orm.Participant.create({
        gameId: game.id,
        userId: currentUser.id,
      });

      const response = await request(app)
        .get('/games')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.games).toHaveLength(1);
      expect(response.body.games[0].name).toBe('Game Owned By Other');
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
  let currentUser: any;
  let otherUser: any;
  let authToken: string;
  let game: any;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.Challenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.Participant.destroy({ where: {}, truncate: true, cascade: true });
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

    const participant1 = await orm.Participant.create({
      gameId: game.id,
      userId: currentUser.id,
    });

    const participant2 = await orm.Participant.create({
      gameId: game.id,
      userId: otherUser.id,
    });

    await orm.Challenge.create({
      userId: currentUser.id,
      participantId: participant1.id,
      description: 'Challenge for current user',
      selected: false,
    });

    await orm.Challenge.create({
      userId: otherUser.id,
      participantId: participant2.id,
      description: 'Challenge for other user',
      selected: false,
    });

    authToken = generateToken(currentUser.id);
  });

  describe('with valid request', () => {
    it('should return 200 with game details for setup status', async () => {
      const response = await request(app)
        .get(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.game).toBeDefined();
      expect(response.body.game.name).toBe('Test Game');
      expect(response.body.game.status).toBe('setup');
      expect(response.body.game.ownerId).toBe(currentUser.id);

      expect(response.body.game.participants).toBeDefined();
      expect(response.body.game.participants).toHaveLength(2);
      response.body.game.participants.forEach((participant: any) => {
        expect(participant).toHaveProperty('id');
        expect(participant).toHaveProperty('firstName');
        expect(participant).toHaveProperty('lastName');
        expect(participant).toHaveProperty('email');
        expect(participant).toHaveProperty('challengesNotSelected');
        expect(participant.password).toBeUndefined();
      });

      expect(response.body.game.owner).toBeDefined();
      expect(response.body.game.owner.id).toBe(currentUser.id);

      // victim and challenge are undefined when game is in 'setup' status
      expect(response.body.game.victim).toBeUndefined();
      expect(response.body.game.challenge).toBeUndefined();
    });

    it('should include victim and challenge when game is in progress', async () => {
      // Get participants - need explicit id attribute due to Sequelize config
      const participants = await orm.Participant.findAll({
        where: { gameId: game.id },
        attributes: ['id', 'userId', 'gameId', 'participantKillerId'],
      });
      const killerParticipant = participants.find((p: any) => p.userId === currentUser.id)!;
      const victimParticipant = participants.find((p: any) => p.userId === otherUser.id)!;

      // Store IDs before update (update() modifies the object)
      const killerParticipantId = killerParticipant.id;
      const victimParticipantId = victimParticipant.id;

      // Set up killer relationship: victim's killer is the currentUser
      await victimParticipant.update({ participantKillerId: killerParticipantId });

      // Create challenge for the victim participant (the challenge the killer needs to complete)
      await orm.Challenge.create({
        userId: otherUser.id,
        participantId: victimParticipantId,
        description: 'Victim challenge to complete',
        selected: true,
      });

      // Update game status to 'in progress'
      await game.update({ status: 'in progress' });

      const response = await request(app)
        .get(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.game.status).toBe('in progress');

      expect(response.body.game.victim).toBeDefined();
      expect(response.body.game.victim.id).toBe(otherUser.id);
      expect(response.body.game.victim.firstName).toBe('Other');

      expect(response.body.game.challenge).toBeDefined();
      expect(response.body.game.challenge.description).toBe('Victim challenge to complete');
    });
  });

  describe('when game is not found', () => {
    it('should return 404', async () => {
      const response = await request(app)
        .get('/games/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Game not found');
    });
  });

  describe('when user is not a participant', () => {
    it('should return 401', async () => {
      const nonParticipant = await orm.User.create({
        firstName: 'Non',
        lastName: 'Participant',
        email: 'nonparticipant@example.com',
        password: 'password123',
        active: true,
      });

      const nonParticipantToken = generateToken(nonParticipant.id);

      const response = await request(app)
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
  let currentUser: any;
  let participant1: any;
  let participant2: any;
  let authToken: string;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.Challenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.Participant.destroy({ where: {}, truncate: true, cascade: true });
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
      const response = await request(app)
        .post('/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Game',
          userIds: [participant1.id, participant2.id],
        });

      expect(response.status).toBe(201);
      expect(response.body.game).toBeDefined();
      expect(response.body.game.name).toBe('New Game');
      expect(response.body.game.ownerId).toBe(currentUser.id);
      expect(response.body.game.status).toBe('setup');

      // Verify participants were created in the database
      const participants = await orm.Participant.findAll({
        where: { gameId: response.body.game.id },
      });
      expect(participants).toHaveLength(3); // currentUser + 2 participants
    });
  });

  describe('with validation errors', () => {
    it('should return 400 when name is too short', async () => {
      const response = await request(app)
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
      const response = await request(app)
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

      const response = await request(app)
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

      const response = await request(app)
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
  let currentUser: any;
  let otherUser: any;
  let authToken: string;
  let game: any;
  let participant1: any;
  let participant2: any;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    await orm.Challenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.Participant.destroy({ where: {}, truncate: true, cascade: true });
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

    participant1 = await orm.Participant.create({ gameId: game.id, userId: currentUser.id });
    participant2 = await orm.Participant.create({ gameId: game.id, userId: otherUser.id });

    // Create challenges with selected: false (required by findGame middleware)
    await orm.Challenge.create({
      userId: currentUser.id,
      participantId: participant1.id,
      description: 'Challenge for current user',
      selected: false,
    });
    await orm.Challenge.create({
      userId: otherUser.id,
      participantId: participant2.id,
      description: 'Challenge for other user',
      selected: false,
    });

    authToken = generateToken(currentUser.id);
  });

  describe('when updating game name', () => {
    it('should return 200 and update the name without sending emails', async () => {
      const response = await request(app)
        .patch(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Game Name' });

      expect(response.status).toBe(200);
      expect(response.body.game.name).toBe('Updated Game Name');

      // Verify in database
      const updatedGame = await orm.Game.findByPk(game.id);
      expect(updatedGame!.name).toBe('Updated Game Name');

      // Verify no emails were sent (only sent when starting game)
      expect(sendgridMail.send).not.toHaveBeenCalled();
    });
  });

  describe('when starting the game (setup -> in progress)', () => {
    beforeEach(async () => {
      // Create challenges for participants - each needs at least 2
      const participants = await orm.Participant.findAll({
        where: { gameId: game.id },
        attributes: ['id', 'userId'],
      });

      await Promise.all(participants.flatMap((participant: any) => [
        orm.Challenge.create({
          userId: participant.userId,
          participantId: participant.id,
          description: 'Challenge 1',
          selected: false,
        }),
        orm.Challenge.create({
          userId: participant.userId,
          participantId: participant.id,
          description: 'Challenge 2',
          selected: false,
        }),
      ]));
    });

    it('should return 200, assign challenges, set up killer relationships, and send emails', async () => {
      const response = await request(app)
        .patch(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in progress' });

      expect(response.status).toBe(200);
      expect(response.body.game.status).toBe('in progress');

      // Verify game status in database
      const updatedGame = await orm.Game.findByPk(game.id);
      expect(updatedGame!.status).toBe('in progress');

      // Verify killer relationships were set up (each participant has a killer)
      const participants = await orm.Participant.findAll({
        where: { gameId: game.id },
        attributes: ['id', 'userId', 'participantKillerId'],
      });
      expect(participants).toHaveLength(2);
      participants.forEach((participant: any) => {
        expect(participant.participantKillerId).not.toBeNull();
      });

      // Verify each participant is assigned as killer to exactly one other participant
      const killerIds = participants.map((p: any) => p.participantKillerId);
      const participantIds = participants.map((p: any) => p.id);
      killerIds.forEach((killerId: any) => {
        expect(participantIds).toContain(killerId);
      });

      // Verify challenges were selected (one per participant should be selected)
      const selectedChallenges = await orm.Challenge.findAll({
        where: { selected: true },
      });
      expect(selectedChallenges).toHaveLength(2);

      // Verify emails were sent (one per participant)
      expect(sendgridMail.send).toHaveBeenCalledTimes(2);
    });

    it('should return 406 when participants do not have enough challenges', async () => {
      // Remove the extra challenges created in nested beforeEach, leaving only 1 per participant
      await orm.Challenge.destroy({
        where: { description: { [Op.like]: 'Challenge 1' } },
      });
      await orm.Challenge.destroy({
        where: { description: { [Op.like]: 'Challenge 2' } },
      });

      const response = await request(app)
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

      const response = await request(app)
        .patch(`/games/${game.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ name: 'Hacked Name' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied: you cannot modify a game unless you own it');
    });
  });

  describe('when game is not found', () => {
    it('should return 404', async () => {
      const response = await request(app)
        .patch('/games/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Game not found');
    });
  });

  describe('with validation errors', () => {
    it('should return 400 when name is too short', async () => {
      const response = await request(app)
        .patch(`/games/${game.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'A' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.name.msg).toContain('name');
    });

    it('should return 400 when status is invalid', async () => {
      const response = await request(app)
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
  let currentUser: any;
  let otherUser: any;
  let authToken: string;
  let game: any;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.Challenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.Participant.destroy({ where: {}, truncate: true, cascade: true });
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

    const participant1 = await orm.Participant.create({ gameId: game.id, userId: currentUser.id });
    const participant2 = await orm.Participant.create({ gameId: game.id, userId: otherUser.id });

    // Create challenges (required by findGame middleware)
    await orm.Challenge.create({
      userId: currentUser.id,
      participantId: participant1.id,
      description: 'Challenge 1',
      selected: false,
    });
    await orm.Challenge.create({
      userId: otherUser.id,
      participantId: participant2.id,
      description: 'Challenge 2',
      selected: false,
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
    });
  });

  describe('when user is not the owner', () => {
    it('should return 403', async () => {
      const otherUserToken = generateToken(otherUser.id);

      const response = await request(app)
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
      const response = await request(app)
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
