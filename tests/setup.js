require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.PASSWORD_SALT_ROUNDS = '1';

// Suppress console.log during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console.log = jest.fn();
}
