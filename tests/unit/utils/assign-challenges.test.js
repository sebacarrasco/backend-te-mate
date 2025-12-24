const { assignChallenges } = require('../../../src/utils/assign-challenges');

describe('assignChallenges', () => {
  let mockGame;

  beforeEach(() => {
    mockGame = {
      participants: [
        {
          id: 'participant-1',
          Participant: { id: 'p1', setKiller: jest.fn() },
          Challenges: [
            {
              description: 'Challenge 1A',
              setParticipant: jest.fn(),
              save: jest.fn(),
              selected: false,
            },
            {
              description: 'Challenge 1B',
              setParticipant: jest.fn(),
              save: jest.fn(),
              selected: false,
            },
          ],
        },
        {
          id: 'participant-2',
          Participant: { id: 'p2', setKiller: jest.fn() },
          Challenges: [
            {
              description: 'Challenge 2A',
              setParticipant: jest.fn(),
              save: jest.fn(),
              selected: false,
            },
            {
              description: 'Challenge 2B',
              setParticipant: jest.fn(),
              save: jest.fn(),
              selected: false,
            },
          ],
        },
      ],
    };
  });

  describe('when some participants do not have enough challenges', () => {
    it('should return [false, {}]', async () => {
      mockGame.participants[0].Challenges = [{ description: 'Only one' }];

      const result = await assignChallenges(mockGame);

      expect(result).toEqual([false, {}]);
    });
  });

  describe('when all participants have enough challenges', () => {
    it('should assign challenges and return [true, emailsInfo]', async () => {
      const [success, emailsInfo] = await assignChallenges(mockGame);

      expect(success).toBe(true);
      expect(emailsInfo).toHaveLength(2);
      emailsInfo.forEach((info) => {
        expect(info).toHaveProperty('killer');
        expect(info).toHaveProperty('participant');
        expect(info).toHaveProperty('challengeDescription');
      });
    });

    it('should mark selected challenges and save them', async () => {
      await assignChallenges(mockGame);

      const allChallenges = mockGame.participants.flatMap((p) => p.Challenges);
      const selectedChallenges = allChallenges.filter((c) => c.selected === true);
      expect(selectedChallenges.length).toBe(2);
      selectedChallenges.forEach((challenge) => {
        expect(challenge.save).toHaveBeenCalled();
        expect(challenge.setParticipant).toHaveBeenCalled();
      });
    });

    it('should set killer for each participant', async () => {
      await assignChallenges(mockGame);

      mockGame.participants.forEach((p) => {
        expect(p.Participant.setKiller).toHaveBeenCalled();
      });
    });
  });
});
