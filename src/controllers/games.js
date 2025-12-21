const express = require('express');
const jwt = require('express-jwt');
const { check } = require('express-validator');
const { setCurrentUser } = require('../middlewares/auth');
const { fieldValidator } = require('../middlewares/field-validator');
const {
  findUsers, findGame, checkOwner, checkName, checkGameParams, checkStatus, findVictim,
} = require('../middlewares/games');
const { assignChallenges } = require('../utils/assign-challenges');
const sendGameStartedEmail = require('../mailers/game-started');

const router = express.Router();

router.use(jwt({ secret: process.env.JWT_SECRET, requestProperty: 'authData', algorithms: ['HS256'] }));
router.use(setCurrentUser);

router.get('/', async (req, res) => {
  console.log(`Fetching games for user ${req.currentUser.id}`);
  try {
    const games = await req.currentUser.getGames({
      joinTableAttributes: ['alive'],
      order: [['updatedAt', 'DESC']],
    });
    console.log(`Found ${games.length} games for user ${req.currentUser.id}`);
    return res.status(200).send({ games });
  } catch (error) {
    console.error(`Error fetching games - ${error.message}`);
    return res.status(500).send();
  }
});

router.get('/:gameId', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, findVictim, async (req, res) => {
  console.log(`Fetching game ${req.params.gameId} details`);
  const game = req.game.toJSON();
  game.participants = game.participants.map(({ Challenges, ...rest }) => ({
    ...rest,
    challengesNotSelected: Challenges.length,
  }));
  console.log(`Game ${req.game.name} has ${game.participants.length} participants`);
  return res.status(200).send({
    game: {
      ...game,
      victim: req.victimUser,
      challenge: req.challenge,
    },
  });
});

router.post('/', [
  check('userIds', 'userIds must be an array of uuids').isArray(),
  check('userIds.*', 'userIds must be an array of uuids').isUUID(),
  check('name', 'name should be a string').isString(),
  check('name', 'name should be at least 2 characters long').isLength({ min: 2 }),
  fieldValidator,
], findUsers, async (req, res) => {
  console.log(`Creating game "${req.body.name}" with ${req.users.length} participants`);
  const game = await req.orm.Game.create({
    ownerId: req.currentUser.id,
    name: req.body.name,
  });
  try {
    await game.addParticipants(req.users);
    console.log(`Game ${game.id} created successfully`);
  } catch (error) {
    console.error(`Error adding participants to game - ${error.message}`);
    return res.status(500).send();
  }
  return res.status(201).send({ game });
});

router.patch('/:gameId', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, checkOwner, checkGameParams, checkName, checkStatus, async (req, res) => {
  console.log(`Updating game ${req.params.gameId}`);
  try {
    let emailsInfo;
    req.game.name = req.body.name || req.game.name;
    if (req.game.status === 'setup' && req.body.status === 'in progress') {
      console.log(`Starting game ${req.game.id} - assigning challenges`);
      const results = await assignChallenges(req.game);
      if (!results[0]) {
        console.log('Cannot start game - not every participant has 2 or more challenges');
        return res.status(406).send({ message: 'Not every participant has 2 or more challenges' });
      }
      req.game.status = 'in progress';
      [, emailsInfo] = results;
      console.log(`Game ${req.game.id} started - challenges assigned to ${emailsInfo.length} participants`);
    } else if (req.game.status === 'in progress' && req.body.status === 'completed') {
      console.log(`Completing game ${req.game.id}`);
      req.game.status = req.body.status;
    }
    await req.game.save();
    console.log(`Game ${req.game.id} updated successfully`);
    const { participants, ...rest } = req.game.toJSON();
    res.status(200).send({ game: rest });
    return await Promise.all(emailsInfo.map(async (e) => {
      await sendGameStartedEmail(req.game, e.killer, e.participant, e.challengeDescription);
    }));
  } catch (error) {
    console.error(`Error updating game ${req.params.gameId} - ${error.message}`);
    return res.status(500).send();
  }
});

router.delete('/:gameId', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, checkOwner, async (req, res) => {
  console.log(`Deleting game ${req.params.gameId}`);
  try {
    await req.game.destroy();
    console.log(`Game ${req.params.gameId} deleted successfully`);
    return res.status(204).send();
  } catch (error) {
    console.error(`Error deleting game ${req.params.gameId} - ${error.message}`);
    return res.status(500).send();
  }
});

module.exports = router;
