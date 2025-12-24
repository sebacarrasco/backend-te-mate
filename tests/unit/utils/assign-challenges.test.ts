import { assignChallenges } from '../../../src/utils/assign-challenges';
import { GameWithParticipants, EmailInfo } from '../../../src/types/models';

type MockGame = {
  participants: Array<{
    id: string;
    Participant: { id: string; setKiller: jest.Mock };
    Challenges: Array<{ description: string; setParticipant: jest.Mock; save: jest.Mock; selected: boolean }>;
  }>;
};

describe('assignChallenges', () => {
  let mockGame: MockGame;

  beforeEach(() => {
    mockGame = {
      participants: [
        {
          id: 'participant-1',
          Participant: { id: 'p1', setKiller: jest.fn() },
          Challenges: [
            {
              description: 'Challenge 1A', setParticipant: jest.fn(), save: jest.fn(), selected: false,
            },
            {
              description: 'Challenge 1B', setParticipant: jest.fn(), save: jest.fn(), selected: false,
            },
          ],
        },
        {
          id: 'participant-2',
          Participant: { id: 'p2', setKiller: jest.fn() },
          Challenges: [
            {
              description: 'Challenge 2A', setParticipant: jest.fn(), save: jest.fn(), selected: false,
            },
            {
              description: 'Challenge 2B', setParticipant: jest.fn(), save: jest.fn(), selected: false,
            },
          ],
        },
      ],
    };
  });

  describe('when some participants do not have enough challenges', () => {
    it('should return [false, {}]', async () => {
      mockGame.participants[0].Challenges = [{
        description: 'Only one', setParticipant: jest.fn(), save: jest.fn(), selected: false,
      }];

      const result = await assignChallenges(mockGame as unknown as GameWithParticipants);

      expect(result).toEqual([false, {}]);
    });
  });

  describe('when all participants have enough challenges', () => {
    it('should assign challenges and return [true, emailsInfo]', async () => {
      const [success, emailsInfo] = await assignChallenges(mockGame as unknown as GameWithParticipants);

      expect(success).toBe(true);
      expect(emailsInfo).toHaveLength(2);
      (emailsInfo as EmailInfo[]).forEach((info) => {
        expect(info).toHaveProperty('killer');
        expect(info).toHaveProperty('participant');
        expect(info).toHaveProperty('challengeDescription');
      });
    });

    it('should mark selected challenges and save them', async () => {
      await assignChallenges(mockGame as unknown as GameWithParticipants);

      const allChallenges = mockGame.participants.flatMap((p) => p.Challenges);
      const selectedChallenges = allChallenges.filter((c) => c.selected === true);
      expect(selectedChallenges.length).toBe(2);
      selectedChallenges.forEach((challenge) => {
        expect(challenge.save).toHaveBeenCalled();
        expect(challenge.setParticipant).toHaveBeenCalled();
      });
    });

    it('should set killer for each participant', async () => {
      await assignChallenges(mockGame as unknown as GameWithParticipants);

      mockGame.participants.forEach((p) => {
        expect(p.Participant.setKiller).toHaveBeenCalled();
      });
    });
  });

  describe('when an error occurs', () => {
    it('should return [false, {}]', async () => {
      mockGame.participants.forEach((p) => {
        p.Challenges.forEach((c) => {
          c.save.mockRejectedValue(new Error('Save failed'));
        });
      });

      const result = await assignChallenges(mockGame as unknown as GameWithParticipants);

      expect(result).toEqual([false, {}]);
    });
  });
});
