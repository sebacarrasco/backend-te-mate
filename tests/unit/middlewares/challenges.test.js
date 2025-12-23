const { challengeOwnerNotCurrentUser, findChallenge } = require('../../../src/middlewares/challenges');

describe('challengeOwnerNotCurrentUser middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      currentUser: { id: 'current-user-id' },
      user: { id: 'other-user-id' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('when currentUser is different from challenge owner', () => {
    it('should call next', () => {
      challengeOwnerNotCurrentUser(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when currentUser is the same as challenge owner', () => {
    it('should return 403 with access denied message', () => {
      mockReq.user.id = 'current-user-id';

      challengeOwnerNotCurrentUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: 'Access denied: you cannot access your own challenges',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('findChallenge middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      params: { challengeId: 'challenge-123' },
      orm: {
        Challenge: {
          findByPk: jest.fn(),
        },
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('when challenge is found', () => {
    it('should set req.user, req.challenge and call next', async () => {
      const mockChallenge = { id: 'challenge-123', userId: 'owner-user-id' };
      mockReq.orm.Challenge.findByPk.mockResolvedValue(mockChallenge);

      await findChallenge(mockReq, mockRes, mockNext);

      expect(mockReq.orm.Challenge.findByPk).toHaveBeenCalledWith('challenge-123');
      expect(mockReq.user).toEqual({ id: 'owner-user-id' });
      expect(mockReq.challenge).toBe(mockChallenge);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when challenge is not found', () => {
    it('should return 404 with challenge not found message', async () => {
      mockReq.orm.Challenge.findByPk.mockResolvedValue(null);

      await findChallenge(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Challenge not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when database throws an error', () => {
    it('should return 500', async () => {
      mockReq.orm.Challenge.findByPk.mockRejectedValue(new Error('Database error'));

      await findChallenge(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
