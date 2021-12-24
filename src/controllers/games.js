const express = require('express');
const jwt = require('express-jwt');
const { check } = require('express-validator');
const { setCurrentUser } = require('../middlewares/auth');
const { fieldValidator } = require('../middlewares/field-validator');
const { findUsers, findGame, checkOwner, checkName, checkGameParams, checkStatus } = require('../middlewares/games');

const router = express.Router();

router.use(jwt({ secret: process.env.JWT_SECRET, requestProperty: 'authData', algorithms: ['HS256'] }));
router.use(setCurrentUser);

router.get('/', async (req, res) => {
  try {
    const games = await req.orm.Game.findAll();
    return res.status(200).send({ games });
  } catch (e) {
    return res.status(500).send();
  }
});

router.post('/', [
  check('userIds', 'userIds must be an array of uuids').isArray(),
  check('userIds.*', 'userIds must be an array of uuids').isUUID(),
  check('name', 'name should be a string').isString(),
  check('name', 'name should be at least 2 characters long').isLength({ min: 2 }),
  fieldValidator,
], findUsers, async (req, res) => {
  const game = await req.orm.Game.create({
    ownerId: req.currentUser.id,
    name: req.body.name,
  });
  try {
    await game.addParticipant(req.users);
  } catch (e) {
    return res.status(500).send();
  }
  return res.status(201).send({ game });
});

router.patch('/:gameId', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, checkOwner, checkGameParams, checkName, checkStatus, async (req, res) => {
  try {
    req.game.name = req.body.name || req.game.name;
    req.game.status = req.body.status || req.game.status;
    await req.game.save();
    return res.status(200).send({ game: req.game });
  } catch (e) {
    return res.status(500).send();
  }
});

router.delete('/:gameId', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, checkOwner, async (req, res) => {
  try {
    await req.game.destroy();
    return res.status(204).send();
  } catch (e) {
    console.log(e)
    return res.status(500).send();
  }
});

module.exports = router;
