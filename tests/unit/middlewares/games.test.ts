import { Op } from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import {
  findUsers,
  findGame,
  checkOwner,
  checkGameParams,
  checkName,
  checkStatus,
  findVictim,
} from '../../../src/middlewares/games';
import { MockRequest, MockResponse, createMockResponse } from '../../types';

describe('findUsers middleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: { userIds: ['user-1', 'user-2'] },
      currentUser: { id: 'current-user-id' },
      orm: {
        User: {
          findAll: jest.fn(),
        },
      },
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('when less than 2 userIds provided', () => {
    it('should return 406 with not enough participants message', async () => {
      mockReq.body.userIds = ['user-1'];

      await findUsers(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(406);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: 'There should be at least 2 other participants',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when all users are found', () => {
    it('should set req.users and call next', async () => {
      const mockUsers = [
        { id: 'user-1', active: true },
        { id: 'user-2', active: true },
        { id: 'current-user-id', active: true },
      ];
      (mockReq.orm!.User!.findAll as jest.Mock).mockResolvedValue(mockUsers);

      await findUsers(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.User!.findAll).toHaveBeenCalledWith({
        where: {
          id: { [Op.in]: ['user-1', 'user-2', 'current-user-id'] },
          active: true,
        },
      });
      expect(mockReq.users).toBe(mockUsers);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when not all users are found', () => {
    it('should return 404 with not every user found message', async () => {
      const mockUsers = [{ id: 'user-1', active: true }];
      (mockReq.orm!.User!.findAll as jest.Mock).mockResolvedValue(mockUsers);

      await findUsers(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Not every user was found' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('findGame middleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      params: { gameId: 'game-123' },
      currentUser: { id: 'current-user-id' },
      orm: {
        Game: {
          findByPk: jest.fn(),
        },
        User: {},
        Challenge: {},
      },
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('when game is found and user is a participant', () => {
    it('should set req.game and call next', async () => {
      const mockGame = {
        id: 'game-123',
        name: 'Test Game',
        participants: [{ id: 'current-user-id' }, { id: 'other-user' }],
      };
      (mockReq.orm!.Game!.findByPk as jest.Mock).mockResolvedValue(mockGame);

      await findGame(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.Game!.findByPk).toHaveBeenCalledWith('game-123', expect.any(Object));
      expect(mockReq.game).toBe(mockGame);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when game is not found', () => {
    it('should return 404 with game not found message', async () => {
      (mockReq.orm!.Game!.findByPk as jest.Mock).mockResolvedValue(null);

      await findGame(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'Game not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is not a participant', () => {
    it('should return 401 with not part of game message', async () => {
      const mockGame = {
        id: 'game-123',
        name: 'Test Game',
        participants: [{ id: 'other-user-1' }, { id: 'other-user-2' }],
      };
      (mockReq.orm!.Game!.findByPk as jest.Mock).mockResolvedValue(mockGame);

      await findGame(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith({ message: 'You are not part of this game' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when database throws an error', () => {
    it('should propagate error to Express error handler', async () => {
      (mockReq.orm!.Game!.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(findGame(mockReq as Request, mockRes as Response, mockNext as NextFunction))
        .rejects.toThrow('Database error');
    });
  });
});

describe('checkOwner middleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      game: { ownerId: 'owner-id' },
      currentUser: { id: 'owner-id' },
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('when user is the owner', () => {
    it('should call next', async () => {
      await checkOwner(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when user is not the owner', () => {
    it('should return 403 with access denied message', async () => {
      mockReq.currentUser = { id: 'other-user-id' };

      await checkOwner(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.send).toHaveBeenCalledWith({
        message: 'Access denied: you cannot modify a game unless you own it',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('checkGameParams middleware', () => {
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

  describe('when name is provided', () => {
    it('should call next', () => {
      mockReq.body.name = 'Game Name';

      checkGameParams(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when status is provided', () => {
    it('should call next', () => {
      mockReq.body.status = 'in progress';

      checkGameParams(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when neither name nor status provided', () => {
    it('should return 400 with error message', () => {
      checkGameParams(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        ok: false,
        errors: {
          body: {
            msg: 'body should contain a name or status property',
            param: 'body',
            location: 'body',
          },
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('checkName middleware', () => {
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

  describe('when name is undefined', () => {
    it('should call next', async () => {
      await checkName(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when name is a valid string', () => {
    it('should call next', async () => {
      mockReq.body.name = 'Valid Name';

      await checkName(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when name is too short', () => {
    it('should return 400 with error message', async () => {
      mockReq.body.name = 'A';

      await checkName(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        ok: false,
        errors: {
          name: {
            msg: 'name should be a string of at least 2 characters long',
            param: 'name',
            location: 'body',
          },
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when name is not a string', () => {
    it('should return 400 with error message', async () => {
      mockReq.body.name = 123;

      await checkName(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        ok: false,
        errors: {
          name: {
            msg: 'name should be a string of at least 2 characters long',
            param: 'name',
            location: 'body',
          },
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('checkStatus middleware', () => {
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

  describe('when status is not provided', () => {
    it('should call next', async () => {
      await checkStatus(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when status is valid', () => {
    it.each(['setup', 'in progress', 'completed'])('should call next for status "%s"', async (status) => {
      mockReq.body.status = status;

      await checkStatus(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when status is invalid', () => {
    it('should return 400 with error message', async () => {
      mockReq.body.status = 'invalid-status';

      await checkStatus(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith({
        ok: false,
        errors: {
          name: {
            msg: "status should be one of the following values: 'setup', 'in progress' or 'completed'",
            param: 'status',
            location: 'body',
          },
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('findVictim middleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      game: {
        id: 123,
        status: 'in progress',
        participants: [
          { id: 'current-user-id', Participant: { id: 1 } },
          { id: 'victim-user-id', Participant: { id: 2 } },
        ],
      },
      currentUser: { id: 'current-user-id' },
      orm: {
        Participant: {
          findOne: jest.fn(),
        },
        User: {
          findByPk: jest.fn(),
        },
        Challenge: {
          findOne: jest.fn(),
        },
      },
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('when game status is not in progress', () => {
    it('should call next without finding victim', async () => {
      mockReq.game = { ...mockReq.game, status: 'setup' };

      await findVictim(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.orm!.Participant!.findOne).not.toHaveBeenCalled();
      expect(mockReq.victimUser).toBeUndefined();
    });
  });

  describe('when game status is in progress and victim is found', () => {
    it('should set req.victimUser, req.challenge and call next', async () => {
      const mockVictimParticipant = { id: 'participant-2', userId: 'victim-user-id' };
      const mockVictimUser = { id: 'victim-user-id', firstName: 'John', lastName: 'Doe' };
      const mockChallenge = { description: 'Test challenge' };

      (mockReq.orm!.Participant!.findOne as jest.Mock).mockResolvedValue(mockVictimParticipant);
      (mockReq.orm!.User!.findByPk as jest.Mock).mockResolvedValue(mockVictimUser);
      (mockReq.orm!.Challenge!.findOne as jest.Mock).mockResolvedValue(mockChallenge);

      await findVictim(mockReq as Request, mockRes as Response, mockNext as NextFunction);

      expect(mockReq.orm!.Participant!.findOne).toHaveBeenCalledWith({
        where: { participantKillerId: 1 },
        attributes: ['id', 'userId'],
      });
      expect(mockReq.orm!.User!.findByPk).toHaveBeenCalledWith('victim-user-id', {
        attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'kills'],
      });
      expect(mockReq.victimUser).toBe(mockVictimUser);
      expect(mockReq.challenge).toBe(mockChallenge);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when database throws an error', () => {
    it('should propagate error to Express error handler', async () => {
      (mockReq.orm!.Participant!.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(findVictim(mockReq as Request, mockRes as Response, mockNext as NextFunction))
        .rejects.toThrow('Database error');
    });
  });
});
