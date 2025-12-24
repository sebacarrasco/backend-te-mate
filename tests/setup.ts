import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.PASSWORD_SALT_ROUNDS = '1';
process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL = 'http://example.com/';

// Mock sendgrid before any modules are loaded
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue({}),
}));

// Suppress console.log during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console.log = jest.fn();
}
