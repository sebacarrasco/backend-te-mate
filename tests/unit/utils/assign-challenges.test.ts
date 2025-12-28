import {
  describe, it, expect, beforeEach, jest,
} from '@jest/globals';
import { assignChallenges } from '../../../src/utils/assign-challenges';
import { ChallengeModel, UserModel, GameModel } from '../../../src/types/models';
import { ORM } from '../../../src/types/orm';

describe('assignChallenges', () => {
  let mockOrm: Partial<ORM>;
  let mockGame: Partial<GameModel>;
  let mockUsers: Partial<UserModel>[];
  let mockChallengesByUser: Record<string, Partial<ChallengeModel>[]>;

  beforeEach(() => {
    mockOrm = {
      Challenge: {
        update: jest.fn<() => Promise<[number, ChallengeModel[]]>>().mockResolvedValue([2, []]),
      } as unknown as ORM['Challenge'],
      AssignedChallenge: {
        bulkCreate: jest.fn<() => Promise<[]>>().mockResolvedValue([]),
      } as unknown as ORM['AssignedChallenge'],
    };

    mockGame = {
      id: 1,
      name: 'Test Game',
      status: 'in progress',
      ownerId: 'owner-1',
    };

    mockUsers = [
      {
        id: 'user-1',
        firstName: 'User',
        lastName: 'One',
        email: 'user1@example.com',
      },
      {
        id: 'user-2',
        firstName: 'User',
        lastName: 'Two',
        email: 'user2@example.com',
      },
    ];

    mockChallengesByUser = {
      'user-1': [
        { id: 1, description: 'Challenge 1A', selected: false },
        { id: 2, description: 'Challenge 1B', selected: false },
      ],
      'user-2': [
        { id: 3, description: 'Challenge 2A', selected: false },
        { id: 4, description: 'Challenge 2B', selected: false },
      ],
    };
  });

  describe('when all participants have enough challenges', () => {
    it('should return an array of EmailInfo objects', async () => {
      const result = await assignChallenges(
        mockOrm as ORM,
        mockGame as GameModel,
        mockUsers as UserModel[],
        mockChallengesByUser as Record<string, ChallengeModel[]>,
      );

      expect(result).toHaveLength(2);
      result.forEach((info) => {
        expect(info).toHaveProperty('killer');
        expect(info).toHaveProperty('victim');
        expect(info).toHaveProperty('challengeDescription');
      });
    });

    it('should assign each user as killer to another user as victim', async () => {
      const result = await assignChallenges(
        mockOrm as ORM,
        mockGame as GameModel,
        mockUsers as UserModel[],
        mockChallengesByUser as Record<string, ChallengeModel[]>,
      );

      const killerIds = result.map((info) => info.killer.id);
      const victimIds = result.map((info) => info.victim.id);

      // Each user should be a killer exactly once
      expect(killerIds).toHaveLength(2);
      expect(new Set(killerIds).size).toBe(2);

      // Each user should be a victim exactly once
      expect(victimIds).toHaveLength(2);
      expect(new Set(victimIds).size).toBe(2);

      // Killer should not be their own victim
      result.forEach((info) => {
        expect(info.killer.id).not.toBe(info.victim.id);
      });
    });

    it('should select challenges from the victim\'s challenge pool', async () => {
      const result = await assignChallenges(
        mockOrm as ORM,
        mockGame as GameModel,
        mockUsers as UserModel[],
        mockChallengesByUser as Record<string, ChallengeModel[]>,
      );

      result.forEach((info) => {
        const victimChallenges = mockChallengesByUser[info.victim.id];
        const challengeDescriptions = victimChallenges.map((c) => c.description);
        expect(challengeDescriptions).toContain(info.challengeDescription);
      });
    });

    it('should call orm.Challenge.update to mark challenges as selected', async () => {
      await assignChallenges(
        mockOrm as ORM,
        mockGame as GameModel,
        mockUsers as UserModel[],
        mockChallengesByUser as Record<string, ChallengeModel[]>,
      );

      expect(mockOrm.Challenge!.update).toHaveBeenCalledTimes(1);
      expect(mockOrm.Challenge!.update).toHaveBeenCalledWith(
        { selected: true },
        expect.objectContaining({ where: expect.any(Object) }),
      );
    });

    it('should call orm.AssignedChallenge.bulkCreate with correct data', async () => {
      await assignChallenges(
        mockOrm as ORM,
        mockGame as GameModel,
        mockUsers as UserModel[],
        mockChallengesByUser as Record<string, ChallengeModel[]>,
      );

      expect(mockOrm.AssignedChallenge!.bulkCreate).toHaveBeenCalledTimes(1);
      expect(mockOrm.AssignedChallenge!.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            gameId: mockGame.id,
            killerId: expect.any(String),
            victimId: expect.any(String),
            challengeId: expect.any(Number),
          }),
        ]),
      );
    });
  });
});
