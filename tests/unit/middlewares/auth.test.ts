import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import {
  describe, it, expect, beforeEach, jest,
} from '@jest/globals';
import {
  setCurrentUser,
  emailToLowerCase,
  emailIsUnique,
  setCurrentUserURLToken,
} from '../../../src/middlewares/auth';
import { MockRequest, MockResponse, createMockResponse } from '../../types';

describe('emailToLowerCase middleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('when email exists in request body', () => {
    it('should convert mixed case email to lowercase', () => {
      mockReq.body.email = 'TeSt@ExAmPlE.CoM';

      emailToLowerCase(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('when email does not exist in request body', () => {
    it('should call next without modifying request', () => {
      emailToLowerCase(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.body.email).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

describe('emailIsUnique middleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: { email: 'test@example.com' },
      orm: {
        User: {
          findOne: jest.fn(),
        },
      },
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('when email is unique', () => {
    it('should call next', async () => {
      (mockReq.orm!.User!.findOne as jest.Mock<any>).mockResolvedValue(null);

      await emailIsUnique(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.User!.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', active: true },
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when email already exists', () => {
    it('should return 409 with error message', async () => {
      const mockUser = { id: 'existing-user-id', email: 'test@example.com', active: true };
      (mockReq.orm!.User!.findOne as jest.Mock<any>).mockResolvedValue(mockUser);

      await emailIsUnique(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.User!.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', active: true },
      });
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: 'An account associated with this email already exists',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('setCurrentUserURLToken middleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      params: { token: jwt.sign({ sub: 'test-user-id' }, process.env.JWT_SECRET as string) },
      orm: {
        User: {
          findByPk: jest.fn(),
        },
      },
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('when token is valid and user exists and is not active', () => {
    it('should set currentUser and call next', async () => {
      const mockUser = { id: 'test-user-id', active: false };
      (mockReq.orm!.User!.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

      await setCurrentUserURLToken(mockReq as Request<{ token: string }>, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.User!.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(mockReq.currentUser).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });
  });

  describe('when token is invalid', () => {
    it('should redirect to invalid URL', async () => {
      mockReq.params = { token: 'invalid-token' };

      await setCurrentUserURLToken(mockReq as Request<{ token: string }>, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.redirect).toHaveBeenCalledWith('http://example.com/invalid');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is not found', () => {
    it('should redirect to invalid URL', async () => {
      (mockReq.orm!.User!.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await setCurrentUserURLToken(mockReq as Request<{ token: string }>, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.redirect).toHaveBeenCalledWith('http://example.com/invalid');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is already active', () => {
    it('should redirect to invalid URL', async () => {
      const mockUser = { id: 'test-user-id', active: true };
      (mockReq.orm!.User!.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

      await setCurrentUserURLToken(mockReq as Request<{ token: string }>, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.redirect).toHaveBeenCalledWith('http://example.com/invalid');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('setCurrentUser middleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      auth: { sub: 'test-user-id' },
      orm: {
        User: {
          findByPk: jest.fn(),
        },
      },
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('when user exists and is active', () => {
    it('should set currentUser and call next', async () => {
      const mockUser = { id: 'test-user-id', active: true };
      (mockReq.orm!.User!.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

      await setCurrentUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.User!.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(mockReq.currentUser).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when user is not found', () => {
    it('should return 401 with invalid token message', async () => {
      (mockReq.orm!.User!.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await setCurrentUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.User!.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is not active', () => {
    it('should return 401 with invalid token message', async () => {
      const mockUser = { id: 'test-user-id', active: false };
      (mockReq.orm!.User!.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

      await setCurrentUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.User!.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when auth is missing', () => {
    it('should return 401 with invalid token message', async () => {
      delete mockReq.auth;

      await setCurrentUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
