const { setCurrentUser } = require('../../../src/middlewares/auth');

describe('setCurrentUser middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      authData: { sub: 'test-user-id' },
      orm: {
        User: {
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

  describe('when user exists and is active', () => {
    it('should set currentUser and call next', async () => {
      const mockUser = { id: 'test-user-id', active: true };
      mockReq.orm.User.findByPk.mockResolvedValue(mockUser);

      await setCurrentUser(mockReq, mockRes, mockNext);

      expect(mockReq.orm.User.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(mockReq.currentUser).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when user is not found', () => {
    it('should return 401 with invalid token message', async () => {
      mockReq.orm.User.findByPk.mockResolvedValue(null);

      await setCurrentUser(mockReq, mockRes, mockNext);

      expect(mockReq.orm.User.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is not active', () => {
    it('should return 401 with invalid token message', async () => {
      const mockUser = { id: 'test-user-id', active: false };
      mockReq.orm.User.findByPk.mockResolvedValue(mockUser);

      await setCurrentUser(mockReq, mockRes, mockNext);

      expect(mockReq.orm.User.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when authData is missing', () => {
    it('should return 401 with invalid token message', async () => {
      delete mockReq.authData;

      await setCurrentUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when database throws an error', () => {
    it('should return 401 with invalid token message', async () => {
      mockReq.orm.User.findByPk.mockRejectedValue(new Error('Database error'));

      await setCurrentUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
