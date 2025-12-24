import { Request, Response } from 'express';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Omit these properties from Request to allow partial/mock versions
type OmittedRequestProps = 'orm' | 'currentUser' | 'user' | 'game' | 'challenge' | 'victimUser' | 'users' | 'auth';

// Mock request type for tests - allows partial orm and other custom properties
export interface MockRequest extends Omit<Partial<Request>, OmittedRequestProps> {
  orm?: DeepPartial<Request['orm']>;
  auth?: Request['auth'];
  currentUser?: DeepPartial<Request['currentUser']>;
  user?: DeepPartial<Request['user']>;
  game?: DeepPartial<Request['game']>;
  challenge?: DeepPartial<Request['challenge']>;
  victimUser?: DeepPartial<Request['victimUser']>;
  users?: Request['users']; // Keep as array, not Partial
}

export interface MockResponse extends Partial<Response> {
  status: jest.Mock;
  send: jest.Mock;
  redirect?: jest.Mock;
}

export const createMockResponse = (): MockResponse => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  redirect: jest.fn(),
});
