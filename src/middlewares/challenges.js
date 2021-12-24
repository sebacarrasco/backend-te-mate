const challengeOwnerNotCurrentUser = (req, res, next) => {
  if (req.currentUser.id === req.user.id) { return res.status(403).send({ message: 'Access denied: you cannot access your own challenges' }); }
  return next();
};

const findChallenge = async (req, res, next) => {
  try {
    const challenge = await req.orm.Challenge.findByPk(req.params.challengeId);
    if (challenge === null) { return res.status(404).send({ message: 'Challenge not found' }); }
    req.user = { id: challenge.userId };
    req.challenge = challenge;
    return next();
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
};

module.exports = {
  challengeOwnerNotCurrentUser,
  findChallenge,
};
