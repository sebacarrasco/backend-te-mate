const challengeOwnerNotCurrentUser = (req, res, next) => {
  console.log(`Checking if user ${req.currentUser.id} is different from challenge owner ${req.user.id}`);
  if (req.currentUser.id === req.user.id) {
    return res.status(403).send({ message: 'Access denied: you cannot access your own challenges' });
  }
  return next();
};

const findChallenge = async (req, res, next) => {
  console.log(`Looking for challenge with id ${req.params.challengeId}`);
  try {
    const challenge = await req.orm.Challenge.findByPk(req.params.challengeId);
    if (challenge === null) {
      return res.status(404).send({ message: 'Challenge not found' });
    }
    req.user = { id: challenge.userId };
    req.challenge = challenge;
    console.log(`Challenge found, belongs to user ${challenge.userId}`);
    return next();
  } catch (error) {
    console.error(`Error finding challenge - ${error.message}`, error);
    return res.status(500).send();
  }
};

module.exports = {
  challengeOwnerNotCurrentUser,
  findChallenge,
};
