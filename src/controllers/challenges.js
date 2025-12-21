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
  console.log(`Creating challenge for user ${req.user.id}`);
  try {
    const challenge = await req.orm.Challenge.create({
      userId: req.user.id,
      description: req.body.description,
    });
    console.log(`Challenge ${challenge.id} created successfully for user ${req.user.id}`);
    return res.status(201).send({ challenge });
  } catch (error) {
    console.error(`Error creating challenge - ${error.message}`);
    return res.status(500).send();
  }
});

router.patch('/:challengeId', [
  check('challengeId', 'challengeId must be an integer').isInt(),
  check('description', 'description should be a string').isString(),
  check('description', 'description should be at least 5 characters long').isLength({ min: 5 }),
  fieldValidator,
], findChallenge, challengeOwnerNotCurrentUser, async (req, res) => {
  console.log(`Updating challenge ${req.params.challengeId}`);
  try {
    req.challenge.description = req.body.description;
    await req.challenge.save();
    console.log(`Challenge ${req.challenge.id} updated successfully`);
    return res.status(200).send({ challenge: req.challenge });
  } catch (error) {
    console.error(`Error updating challenge ${req.params.challengeId} - ${error.message}`);
    return res.status(500).send();
  }
});

router.delete('/:challengeId', [
  check('challengeId', 'challengeId must be an integer').isInt(),
  fieldValidator,
], findChallenge, challengeOwnerNotCurrentUser, async (req, res) => {
  console.log(`Deleting challenge ${req.params.challengeId}`);
  try {
    await req.challenge.destroy();
    console.log(`Challenge ${req.params.challengeId} deleted successfully`);
    return res.status(204).send();
  } catch (error) {
    console.error(`Error deleting challenge ${req.params.challengeId} - ${error.message}`);
    return res.status(500).send();
  }
});

module.exports = router;
