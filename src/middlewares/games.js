const { Op } = require('sequelize');

const findUsers = async (req, res, next) => {
  if (req.body.userIds.length === 0) { return res.status(400).send({ message: 'userIds cannot be empty array ' }); }
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
    req.game = await req.orm.Game.findByPk(req.params.gameId);
    if (!req.game) { return res.status(404).send({ message: 'Game not found' }); }
    return next();
  } catch (e) {
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

module.exports = {
  findUsers,
  findGame,
  checkOwner,
  checkGameParams,
  checkName,
  checkStatus,
};
