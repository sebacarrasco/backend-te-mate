const assignChallenges = async (game) => {
  let { participants } = game;
  try {
    const notReadyParticipants = participants.filter(
      (p) => p.Challenges.length < 2,
    );
    if (notReadyParticipants.length !== 0) { return [false, {}]; }
    participants = participants.sort(() => Math.random() - 0.5);
    const emailsInfo = [];
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
  } catch (e) {
    console.log(e);
    return [false, {}];
  }
};

module.exports = {
  assignChallenges,
};
