import {
  GameWithParticipants,
  EmailInfo,
  AssignChallengesResult,
} from '../types/models';

export const assignChallenges = async (game: GameWithParticipants): Promise<AssignChallengesResult> => {
  let { participants } = game;
  const notReadyParticipants = participants.filter(
    (p) => p.Challenges.length < 2,
  );
  if (notReadyParticipants.length !== 0) { return [false, {}]; }

  participants = participants.sort(() => Math.random() - 0.5);
  const emailsInfo: EmailInfo[] = [];
  await Promise.all(participants.map(async (p, index) => {
    const challenge = p.Challenges[
      Math.floor(Math.random() * p.Challenges.length)
    ];
    await challenge.setParticipant(p.Participant.id);
    challenge.selected = true;
    await challenge.save();
    const killer = index === participants.length - 1 ? participants[0] : participants[index + 1];
    await p.Participant.setKiller(killer.Participant.id);
    emailsInfo.push({
      killer,
      participant: p,
      challengeDescription: challenge.description,
    });
  }));
  return [true, emailsInfo];
};
