const request = require('supertest');
const sendgridMail = require('@sendgrid/mail');
const { createApp, orm } = require('../../helpers/app');
const { generateToken } = require('../../../src/utils/jwt');

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue({}),
}));

describe('POST /auth/register', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });
    jest.clearAllMocks();
  });

  describe('with valid registration data', () => {
    it('should return 201 and success message', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User was successfully created');

      const user = await orm.User.findOne({ where: { email: 'john.doe@example.com' } });
      expect(user).not.toBeNull();
      expect(user.firstName).toBe('John');
      expect(user.active).toBe(false);

      expect(sendgridMail.send).toHaveBeenCalled();
    });

    it('should allow registration when user exists but is inactive', async () => {
      await orm.User.create({
        firstName: 'Old',
        lastName: 'User',
        email: 'inactive@example.com',
        password: 'oldpassword',
        active: false,
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'New',
          lastName: 'User',
          email: 'inactive@example.com',
          password: 'newpassword123',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User was successfully created');
      expect(sendgridMail.send).toHaveBeenCalled();
    });
  });

  describe('with invalid email format', () => {
    it('should return 400 with validation error', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.email).toBeDefined();
    });
  });

  describe('with password too short', () => {
    it('should return 400 with validation error', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: '12345',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.password).toBeDefined();
    });
  });

  describe('when email already exists', () => {
    it('should return 409 with conflict message', async () => {
      await orm.User.create({
        firstName: 'Existing',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'password123',
        active: true,
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('An account associated with this email already exists');
    });
  });

  describe('with missing required fields', () => {
    it('should return 400 when firstName is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
});

describe('POST /auth/login', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });

    await orm.User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      active: true,
    });
  });

  describe('with valid credentials', () => {
    it('should return 201 with access token', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.access_token).toBeDefined();
      expect(response.body.tokenType).toBe('Bearer');
    });
  });

  describe('when user is not found', () => {
    it('should return 404 with error message', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('No user found with nonexistent@example.com');
    });
  });

  describe('when password is incorrect', () => {
    it('should return 401 with invalid password message', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid password');
    });
  });

  describe('when user exists but is inactive', () => {
    it('should return 404 with error message', async () => {
      await orm.User.create({
        firstName: 'Inactive',
        lastName: 'User',
        email: 'inactive@example.com',
        password: 'password123',
        active: false,
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('No user found with inactive@example.com');
    });
  });
});

describe('GET /auth/confirmation/:token', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });
  });

  describe('with valid token for inactive user', () => {
    it('should redirect to confirmation-success and activate user', async () => {
      const user = await orm.User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        active: false,
      });

      const token = generateToken(user.id);

      const response = await request(app)
        .get(`/auth/confirmation/${token}`);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('confirmation-success');

      const updatedUser = await orm.User.findByPk(user.id);
      expect(updatedUser.active).toBe(true);
    });
  });

  describe('with invalid token', () => {
    it('should redirect to invalid URL', async () => {
      const response = await request(app)
        .get('/auth/confirmation/invalid-token');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('invalid');
    });
  });

  describe('with token for already active user', () => {
    it('should redirect to invalid URL', async () => {
      const user = await orm.User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        active: true,
      });

      const token = generateToken(user.id);

      const response = await request(app)
        .get(`/auth/confirmation/${token}`);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('invalid');
    });
  });

  describe('with token for non-existent user', () => {
    it('should redirect to invalid URL', async () => {
      const token = generateToken('00000000-0000-0000-0000-000000000000');

      const response = await request(app)
        .get(`/auth/confirmation/${token}`);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('invalid');
    });
  });
});

describe('GET /auth/desconfirmation/:token', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await orm.User.destroy({ where: {}, truncate: true, cascade: true });
  });

  describe('with valid token for inactive user', () => {
    it('should redirect to desconfirmation-success and delete user', async () => {
      const user = await orm.User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        active: false,
      });

      const token = generateToken(user.id);

      const response = await request(app)
        .get(`/auth/desconfirmation/${token}`);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('desconfirmation-success');

      const deletedUser = await orm.User.findByPk(user.id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('with invalid token', () => {
    it('should redirect to invalid URL', async () => {
      const response = await request(app)
        .get('/auth/desconfirmation/invalid-token');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('invalid');
    });
  });

  describe('with token for non-existent user', () => {
    it('should redirect to invalid URL', async () => {
      const token = generateToken('00000000-0000-0000-0000-000000000000');

      const response = await request(app)
        .get(`/auth/desconfirmation/${token}`);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('invalid');
    });
  });
});
