const express = require('express');
const jwt = require('express-jwt');
const { check } = require('express-validator');
const { setCurrentUser } = require('../middlewares/auth');
const { challengeOwnerNotCurrentUser, findChallenge } = require('../middlewares/challenges');
const { fieldValidator } = require('../middlewares/field-validator');
const { findUser } = require('../middlewares/users');

const router = express.Router();
router.use(jwt({ secret: process.env.JWT_SECRET, requestProperty: 'authData', algorithms: ['HS256'] }));
router.use(setCurrentUser);

router.post('/', [
  check('userId', 'userId must be an uuid').isUUID(),
  check('description', 'description should be a string').isString(),
  check('description', 'description should be at least 5 characters long').isLength({ min: 5 }),
  fieldValidator,
], findUser, challengeOwnerNotCurrentUser, async (req, res) => {
  try {
    const challenge = await req.orm.Challenge.create({
      userId: req.user.id,
      description: req.body.description,
    });
    return res.status(201).send({ challenge });
  } catch (e) {
    return res.status(500).send();
  }
});

router.patch('/:challengeId', [
  check('challengeId', 'challengeId must be an integer').isInt(),
  check('description', 'description should be a string').isString(),
  check('description', 'description should be at least 5 characters long').isLength({ min: 5 }),
  fieldValidator,
], findChallenge, challengeOwnerNotCurrentUser, async (req, res) => {
  try {
    req.challenge.description = req.body.description;
    await req.challenge.save();
    return res.status(200).send({ challenge: req.challenge });
  } catch (e) {
    return res.status(500).send();
  }
});

router.delete('/:challengeId', [
  check('challengeId', 'challengeId must be an integer').isInt(),
  fieldValidator,
], findChallenge, challengeOwnerNotCurrentUser, async (req, res) => {
  try {
    await req.challenge.destroy();
    return res.status(204).send();
  } catch (e) {
    return res.status(500).send();
  }
});

module.exports = router;
