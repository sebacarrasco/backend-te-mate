const express = require('express');
const jwt = require('express-jwt');
const { check } = require('express-validator');
const { setCurrentUser } = require('../middlewares/auth');
const { fieldValidator } = require('../middlewares/field-validator');
const { findUsers } = require('../middlewares/games');

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

module.exports = router;
