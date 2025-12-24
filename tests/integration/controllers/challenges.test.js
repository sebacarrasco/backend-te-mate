const request = require('supertest');
const { createApp, orm } = require('../../helpers/app');
const { generateToken } = require('../../../src/utils/jwt');

describe('POST /challenges', () => {
  let app;
  let currentUser;
  let targetUser;
  let authToken;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.Challenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });

    currentUser = await orm.User.create({
      firstName: 'Current',
      lastName: 'User',
      email: 'current@example.com',
      password: 'password123',
      active: true,
    });

    targetUser = await orm.User.create({
      firstName: 'Target',
      lastName: 'User',
      email: 'target@example.com',
      password: 'password123',
      active: true,
    });

    authToken = generateToken(currentUser.id);
  });

  describe('with valid data', () => {
    it('should return 201 with created challenge', async () => {
      const response = await request(app)
        .post('/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: targetUser.id,
          description: 'Make them laugh in public',
        });

      expect(response.status).toBe(201);
      expect(response.body.challenge).toBeDefined();
      expect(response.body.challenge.description).toBe('Make them laugh in public');
      expect(response.body.challenge.userId).toBe(targetUser.id);
    });
  });

  describe('with invalid userId', () => {
    it('should return 400 when userId is not a UUID', async () => {
      const response = await request(app)
        .post('/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: 'not-a-uuid',
          description: 'Valid description',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.userId).toBeDefined();
    });
  });

  describe('with description too short', () => {
    it('should return 400 with validation error', async () => {
      const response = await request(app)
        .post('/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: targetUser.id,
          description: 'Hi',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.description).toBeDefined();
    });
  });

  describe('when target user is not found', () => {
    it('should return 404', async () => {
      const response = await request(app)
        .post('/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: '00000000-0000-0000-0000-000000000000',
          description: 'Valid description',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('when creating challenge for yourself', () => {
    it('should return 403 with access denied message', async () => {
      const response = await request(app)
        .post('/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: currentUser.id,
          description: 'Challenge for myself',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied: you cannot access your own challenges');
    });
  });

  describe('without authentication', () => {
    it('should return 401', async () => {
      const response = await request(app)
        .post('/challenges')
        .send({
          userId: targetUser.id,
          description: 'Valid description',
        });

      expect(response.status).toBe(401);
    });
  });
});

describe('PATCH /challenges/:challengeId', () => {
  let app;
  let currentUser;
  let targetUser;
  let authToken;
  let challenge;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.Challenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });

    currentUser = await orm.User.create({
      firstName: 'Current',
      lastName: 'User',
      email: 'current@example.com',
      password: 'password123',
      active: true,
    });

    targetUser = await orm.User.create({
      firstName: 'Target',
      lastName: 'User',
      email: 'target@example.com',
      password: 'password123',
      active: true,
    });

    challenge = await orm.Challenge.create({
      userId: currentUser.id,
      description: 'Original challenge description',
    });

    authToken = generateToken(targetUser.id);
  });

  describe('with valid data', () => {
    it('should return 200 with updated challenge', async () => {
      const response = await request(app)
        .patch(`/challenges/${challenge.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated challenge description',
        });

      expect(response.status).toBe(200);
      expect(response.body.challenge).toBeDefined();
      expect(response.body.challenge.description).toBe('Updated challenge description');
    });
  });

  describe('when challenge is not found', () => {
    it('should return 404', async () => {
      const response = await request(app)
        .patch('/challenges/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Challenge not found');
    });
  });

  describe('with description too short', () => {
    it('should return 400 with validation error', async () => {
      const response = await request(app)
        .patch(`/challenges/${challenge.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Hi',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.description).toBeDefined();
    });
  });

  describe('when updating your own challenge', () => {
    it('should return 403 with access denied message', async () => {
      const ownAuthToken = generateToken(currentUser.id);

      const response = await request(app)
        .patch(`/challenges/${challenge.id}`)
        .set('Authorization', `Bearer ${ownAuthToken}`)
        .send({
          description: 'Trying to update my own challenge',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied: you cannot access your own challenges');
    });
  });

  describe('without authentication', () => {
    it('should return 401', async () => {
      const response = await request(app)
        .patch(`/challenges/${challenge.id}`)
        .send({
          description: 'Updated description',
        });

      expect(response.status).toBe(401);
    });
  });
});

describe('DELETE /challenges/:challengeId', () => {
  let app;
  let currentUser;
  let targetUser;
  let authToken;
  let challenge;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.Challenge.destroy({ where: {}, truncate: true, cascade: true });
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });

    currentUser = await orm.User.create({
      firstName: 'Current',
      lastName: 'User',
      email: 'current@example.com',
      password: 'password123',
      active: true,
    });

    targetUser = await orm.User.create({
      firstName: 'Target',
      lastName: 'User',
      email: 'target@example.com',
      password: 'password123',
      active: true,
    });

    challenge = await orm.Challenge.create({
      userId: currentUser.id,
      description: 'Challenge to be deleted',
    });

    authToken = generateToken(targetUser.id);
  });

  describe('with valid request', () => {
    it('should return 204 and delete the challenge', async () => {
      const response = await request(app)
        .delete(`/challenges/${challenge.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      const deletedChallenge = await orm.Challenge.findByPk(challenge.id);
      expect(deletedChallenge).toBeNull();
    });
  });

  describe('when challenge is not found', () => {
    it('should return 404', async () => {
      const response = await request(app)
        .delete('/challenges/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Challenge not found');
    });
  });

  describe('when deleting your own challenge', () => {
    it('should return 403 with access denied message', async () => {
      const ownAuthToken = generateToken(currentUser.id);

      const response = await request(app)
        .delete(`/challenges/${challenge.id}`)
        .set('Authorization', `Bearer ${ownAuthToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied: you cannot access your own challenges');
    });
  });

  describe('without authentication', () => {
    it('should return 401', async () => {
      const response = await request(app)
        .delete(`/challenges/${challenge.id}`);

      expect(response.status).toBe(401);
    });
  });
});
