import { Request, Response, NextFunction } from 'express';
import {
  describe, it, expect, beforeEach, jest,
} from '@jest/globals';
import { challengeOwnerNotCurrentUser, findChallenge } from '../../../src/middlewares/challenges';
import { MockRequest, MockResponse, createMockResponse } from '../../types';

describe('challengeOwnerNotCurrentUser middleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      currentUser: { id: 'current-user-id' },
      user: { id: 'other-user-id' },
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('when currentUser is different from challenge owner', () => {
    it('should call next', () => {
      challengeOwnerNotCurrentUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when currentUser is the same as challenge owner', () => {
    it('should return 403 with access denied message', () => {
      mockReq.user = { id: 'current-user-id' };

      challengeOwnerNotCurrentUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: 'Access denied: you cannot access your own challenges',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('findChallenge middleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      params: { challengeId: 'challenge-123' },
      orm: {
        Challenge: {
          findByPk: jest.fn(),
        },
      },
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('when challenge is found', () => {
    it('should set req.user, req.challenge and call next', async () => {
      const mockChallenge = { id: 'challenge-123', userId: 'owner-user-id' };
      (mockReq.orm!.Challenge!.findByPk as jest.Mock<any>).mockResolvedValue(mockChallenge);

      await findChallenge(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.Challenge!.findByPk).toHaveBeenCalledWith('challenge-123');
      expect(mockReq.user).toEqual({ id: 'owner-user-id' });
      expect(mockReq.challenge).toBe(mockChallenge);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when challenge is not found', () => {
    it('should return 404 with challenge not found message', async () => {
      (mockReq.orm!.Challenge!.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await findChallenge(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Challenge not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
