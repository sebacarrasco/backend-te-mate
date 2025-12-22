const request = require('supertest');
const { createApp, orm } = require('../../helpers/app');
const { generateToken } = require('../../../src/utils/jwt');
const { generateInvalidToken } = require('../../helpers/auth');

describe('GET /users/:userId', () => {
  let app;
  let testUser;
  let authToken;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });

    testUser = await orm.User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      active: true,
    });

    authToken = generateToken(testUser.id);
  });

  describe('with valid authentication', () => {
    it('should return 200 and user data when user exists', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.firstName).toBe('John');
      expect(response.body.user.lastName).toBe('Doe');
      expect(response.body.user.email).toBe('john.doe@example.com');
      // Password should not be returned
      expect(response.body.user.password).toBeUndefined();
    });

    it('should return 404 when user does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 404 when user is not active', async () => {
      const inactiveUser = await orm.User.create({
        firstName: 'Inactive',
        lastName: 'User',
        email: 'inactive@example.com',
        password: 'password123',
        active: false,
      });

      const response = await request(app)
        .get(`/users/${inactiveUser.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 when userId is not a valid UUID', async () => {
      const response = await request(app)
        .get('/users/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('without authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}`);

      expect(response.status).toBe(401);
    });

    it('should return 401 when invalid token is provided', async () => {
      const invalidToken = generateInvalidToken();

      const response = await request(app)
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('with token for non-existent user', () => {
    it('should return 401 when token belongs to non-existent user', async () => {
      const tokenForNonExistentUser = generateToken('00000000-0000-0000-0000-000000000000');

      const response = await request(app)
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${tokenForNonExistentUser}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
  });
});
