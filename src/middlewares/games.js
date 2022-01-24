const { Op } = require('sequelize');

const findUsers = async (req, res, next) => {
  if (req.body.userIds.length < 2) { return res.status(406).send({ message: 'There should be at least 2 other participants' }); }
  const userIds = [...req.body.userIds, req.currentUser.id];
  try {
    const users = await req.orm.User.findAll({
      where: {
        id: {
          [Op.in]: userIds,
        },
        active: true,
      },
    });
    if (users.length !== userIds.length) { return res.status(404).send({ message: 'Not every user was found' }); }
    req.users = users;
    return next();
  } catch (e) {
    return res.status(400).send({ message: 'Invalid syntax for type uuid' });
  }
};

const findGame = async (req, res, next) => {
  try {
    req.game = await req.orm.Game.findByPk(req.params.gameId, {
      include: [
        {
          model: req.orm.User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email', 'kills'],
        },
        {
          model: req.orm.User,
          as: 'participants',
          attributes: ['id', 'firstName', 'lastName', 'email', 'kills'],
          through: { attributes: ['id', 'alive', 'kills', 'gameId', 'userId'] },
          include: { model: req.orm.Challenge, where: { selected: { [Op.eq]: false } } },
        },
      ],
    });
    if (!req.game) { return res.status(404).send({ message: 'Game not found' }); }
    if (!req.game.participants.map((p) => p.id).includes(req.currentUser.id)) {
      return res.status(401).send({ message: 'You are not part of this game' });
    }
    return next();
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
};

const checkOwner = async (req, res, next) => {
  if (req.game.ownerId !== req.currentUser.id) { return res.status(403).send({ message: 'Access denied: you cannot modify a game unless you own it' }); }
  return next();
};

const checkGameParams = (req, res, next) => {
  if (!req.body.name && !req.body.status) {
    return res.status(400).send({
      ok: false,
      errors: {
        body: {
          msg: 'body should contain a name or status property',
          param: 'body',
          location: 'body',
        },
      },
    });
  }
  return next();
};

const checkName = async (req, res, next) => {
  const newName = req.body.name;
  if (newName !== undefined && (typeof newName !== 'string' || newName.length < 2)) {
    return res.status(400).send({
      ok: false,
      errors: {
        name: {
          msg: 'name should be a string of at least 2 characters long',
          param: 'name',
          location: 'body',
        },
      },
    });
  }
  return next();
};

const checkStatus = async (req, res, next) => {
  if (!!req.body.status && !['setup', 'in progress', 'completed'].includes(req.body.status)) {
    return res.status(400).send({
      ok: false,
      errors: {
        name: {
          msg: "status should be one of the following values: 'setup', 'in progress' or 'completed'",
          param: 'status',
          location: 'body',
        },
      },
    });
  }
  return next();
};

const findVictim = async (req, res, next) => {
  if (req.game.status === 'in progress') {
    try {
      const currentParticipant = req.game.participants.filter(
        (p) => p.id === req.currentUser.id,
      )[0];
      const victimParticipant = await req.orm.Participant.findOne({
        where: { participantKillerId: currentParticipant.Participant.id },
        attributes: ['id', 'userId'],
      });
      req.victimUser = await req.orm.User.findByPk(victimParticipant.userId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'kills'],
      });
      req.challenge = await req.orm.Challenge.findOne({
        where: { participantId: victimParticipant.id }, attributes: ['description'],
      });
      return next();
    } catch (e) {
      console.log(e);
      return res.status(500).send();
    }
  }
  return next();
};

module.exports = {
  findUsers,
  findGame,
  checkOwner,
  checkGameParams,
  checkName,
  checkStatus,
  findVictim,
};
