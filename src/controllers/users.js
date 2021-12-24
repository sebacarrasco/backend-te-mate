const express = require('express');
const jwt = require('express-jwt');
const { check } = require('express-validator');
const { setCurrentUser } = require('../middlewares/auth');
const { challengeOwnerNotCurrentUser } = require('../middlewares/challenges');
const { fieldValidator } = require('../middlewares/field-validator');
const { findUser } = require('../middlewares/users');

const router = express.Router();
router.use(jwt({ secret: process.env.JWT_SECRET, requestProperty: 'authData', algorithms: ['HS256'] }));
router.use(setCurrentUser);

router.get('/', async (req, res) => {
  try {
    const users = await req.orm.User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'kills', 'createdAt'],
    });
    return res.status(200).send({ users });
  } catch (e) {
    return res.status(500).send();
  }
});

router.get('/:userId', [
  check('userId', 'userId must be an uuid').isUUID(),
  fieldValidator,
], findUser, async (req, res) => res.status(200).send({ user: req.user }));

router.get('/:userId/challenges', [
  check('userId', 'userId must be an uuid').isUUID(),
  fieldValidator, findUser, challengeOwnerNotCurrentUser,
], async (req, res) => {
  try {
    const challenges = await req.orm.Challenge.findAll({
      where: { userId: req.user.id },
    });
    return res.status(200).send({ user: req.user, challenges });
  } catch (e) {
    return res.status(500).send();
  }
});

module.exports = router;
