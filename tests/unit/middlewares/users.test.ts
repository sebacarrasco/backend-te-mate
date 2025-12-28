import { Request, Response, NextFunction } from 'express';
import {
  describe, it, expect, beforeEach, jest,
} from '@jest/globals';
import { findUser } from '../../../src/middlewares/users';
import { MockRequest, MockResponse, createMockResponse } from '../../types';

describe('findUser middleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      params: { userId: 'user-123' },
      body: {},
      orm: {
        User: {
          findByPk: jest.fn(),
        },
      },
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('when user is found and active (from params)', () => {
    it('should set req.user and call next', async () => {
      const mockUser = { id: 'user-123', active: true };
      (mockReq.orm!.User!.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

      await findUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.User!.findByPk).toHaveBeenCalledWith('user-123', {
        attributes: ['id', 'firstName', 'lastName', 'email', 'kills', 'createdAt', 'active'],
      });
      expect(mockReq.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when user is found and active (from body)', () => {
    it('should set req.user and call next', async () => {
      const mockUser = { id: 'user-456', active: true };
      mockReq.params = {};
      mockReq.body.userId = 'user-456';
      (mockReq.orm!.User!.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

      await findUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.User!.findByPk).toHaveBeenCalledWith('user-456', expect.any(Object));
      expect(mockReq.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('when user is not found', () => {
    it('should return 404 with user not found message', async () => {
      (mockReq.orm!.User!.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await findUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'User not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is found but not active', () => {
    it('should return 404 with user not found message', async () => {
      const mockUser = { id: 'user-123', active: false };
      (mockReq.orm!.User!.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

      await findUser(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'User not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
