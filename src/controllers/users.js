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
  try {
    const users = await req.orm.User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'kills', 'createdAt'],
      where: { active: true },
    });
    console.log(`Found ${users.length} active users`);
    return res.status(200).send({ users });
  } catch (error) {
    console.error(`Error fetching users - ${error.message}`);
    return res.status(500).send();
  }
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
  try {
    const challenges = await req.orm.Challenge.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']],
    });
    console.log(`Found ${challenges.length} challenges for user ${req.user.id}`);
    return res.status(200).send({ user: { ...req.user.toJSON(), challenges } });
  } catch (error) {
    console.error(`Error fetching challenges - ${error.message}`);
    return res.status(500).send();
  }
});

module.exports = router;
