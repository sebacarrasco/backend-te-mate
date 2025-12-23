const jwtGenerator = require('jsonwebtoken');
const {
  setCurrentUser,
  emailToLowerCase,
  emailIsUnique,
  setCurrentUserURLToken,
} = require('../../../src/middlewares/auth');

describe('emailToLowerCase middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('when email exists in request body', () => {
    it('should convert mixed case email to lowercase', () => {
      mockReq.body.email = 'TeSt@ExAmPlE.CoM';

      emailToLowerCase(mockReq, mockRes, mockNext);

      expect(mockReq.body.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('when email does not exist in request body', () => {
    it('should call next without modifying request', () => {
      emailToLowerCase(mockReq, mockRes, mockNext);

      expect(mockReq.body.email).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

describe('emailIsUnique middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: { email: 'test@example.com' },
      orm: {
        User: {
          findOne: jest.fn(),
        },
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('when email is unique', () => {
    it('should call next', async () => {
      mockReq.orm.User.findOne.mockResolvedValue(null);

      await emailIsUnique(mockReq, mockRes, mockNext);

      expect(mockReq.orm.User.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', active: true },
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when email already exists', () => {
    it('should return 409 with error message', async () => {
      const mockUser = { id: 'existing-user-id', email: 'test@example.com', active: true };
      mockReq.orm.User.findOne.mockResolvedValue(mockUser);

      await emailIsUnique(mockReq, mockRes, mockNext);

      expect(mockReq.orm.User.findOne).toHaveBeenCalledWith({
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
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      params: { token: jwtGenerator.sign({ sub: 'test-user-id' }, process.env.JWT_SECRET) },
      orm: {
        User: {
          findByPk: jest.fn(),
        },
      },
    };
    mockRes = {
      redirect: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('when token is valid and user exists and is not active', () => {
    it('should set currentUser and call next', async () => {
      const mockUser = { id: 'test-user-id', active: false };
      mockReq.orm.User.findByPk.mockResolvedValue(mockUser);

      await setCurrentUserURLToken(mockReq, mockRes, mockNext);

      expect(mockReq.orm.User.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(mockReq.currentUser).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });
  });

  describe('when token is invalid', () => {
    it('should redirect to invalid URL', async () => {
      mockReq.params.token = 'invalid-token';

      await setCurrentUserURLToken(mockReq, mockRes, mockNext);

      expect(mockRes.redirect).toHaveBeenCalledWith('http://example.com/invalid');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is not found', () => {
    it('should redirect to invalid URL', async () => {
      mockReq.orm.User.findByPk.mockResolvedValue(null);

      await setCurrentUserURLToken(mockReq, mockRes, mockNext);

      expect(mockRes.redirect).toHaveBeenCalledWith('http://example.com/invalid');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is already active', () => {
    it('should redirect to invalid URL', async () => {
      const mockUser = { id: 'test-user-id', active: true };
      mockReq.orm.User.findByPk.mockResolvedValue(mockUser);

      await setCurrentUserURLToken(mockReq, mockRes, mockNext);

      expect(mockRes.redirect).toHaveBeenCalledWith('http://example.com/invalid');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

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
