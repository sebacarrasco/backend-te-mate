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
  console.log('Fetching all users');
  const users = await req.orm.User.findAll({
    attributes: ['id', 'firstName', 'lastName', 'email', 'kills', 'createdAt'],
    where: { active: true },
  });
  console.log(`Found ${users.length} active users`);
  return res.status(200).send({ users });
});

router.get('/:userId', [
  check('userId', 'userId must be an uuid').isUUID(),
  fieldValidator,
], findUser, async (req, res) => {
  console.log(`Fetching user ${req.params.userId}`);
  return res.status(200).send({ user: req.user });
});

router.get('/:userId/challenges', [
  check('userId', 'userId must be an uuid').isUUID(),
  fieldValidator,
], findUser, challengeOwnerNotCurrentUser, async (req, res) => {
  console.log(`Fetching challenges for user ${req.params.userId}`);
  const challenges = await req.orm.Challenge.findAll({
    where: { userId: req.user.id },
    order: [['updatedAt', 'DESC']],
  });
  console.log(`Found ${challenges.length} challenges for user ${req.user.id}`);
  return res.status(200).send({ user: { ...req.user.toJSON(), challenges } });
});

module.exports = router;
