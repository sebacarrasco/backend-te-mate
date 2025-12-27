import express, { Request, Response } from 'express';
import { expressjwt } from 'express-jwt';
import { check } from 'express-validator';
import { setCurrentUser } from '../middlewares/auth';
import { fieldValidator } from '../middlewares/field-validator';
import {
  findUsers, findGame, checkOwner, checkName, checkGameParams, checkStatus, findVictim,
} from '../middlewares/games';
import { assignChallenges } from '../utils/assign-challenges';
import sendGameStartedEmail = require('../mailers/game-started');
import '../types/express'; // Import for global type extension

const router = express.Router();

router.use(expressjwt({ secret: process.env.JWT_SECRET as string, algorithms: ['HS256'] }));
router.use(setCurrentUser);

router.get('/', async (req: Request, res: Response) => {
  console.log(`Fetching games for user ${req.currentUser!.id}`);
  const games = await req.currentUser!.getGames({
    joinTableAttributes: ['alive'],
    order: [['updatedAt', 'DESC']],
  });
  console.log(`Found ${games.length} games for user ${req.currentUser!.id}`);
  return res.status(200).send({ games });
});

router.get('/:gameId', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, findVictim, async (req: Request, res: Response) => {
  console.log(`Fetching game ${req.params.gameId} details`);
  const game = req.game!.toJSON();
  const transformedParticipants = (game.participants || []).map(({ Challenges, ...rest }) => ({
    ...rest,
    challengesNotSelected: Challenges?.length || 0,
  }));
  console.log(`Game ${req.game!.name} has ${transformedParticipants.length} participants`);
  return res.status(200).send({
    game: {
      ...game,
      participants: transformedParticipants,
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
], findUsers, async (req: Request, res: Response) => {
  console.log(`Creating game "${req.body.name}" with ${req.users!.length} participants`);
  const game = await req.orm.Game.create({
    ownerId: req.currentUser!.id,
    name: req.body.name,
  });
  await game.addParticipants(req.users!);
  await req.orm.GameUser.bulkCreate(req.users!.map((user) => ({
    userId: user.id,
    gameId: game.id,
    isAlive: true,
    kills: 0,
  })));
  await game.save();
  console.log(`Game ${game.id} created successfully`);
  return res.status(201).send({ game });
});

router.patch('/:gameId', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, checkOwner, checkGameParams, checkName, checkStatus, async (req: Request, res: Response) => {
  console.log(`Updating game ${req.params.gameId}`);
  let emailsInfo;
  req.game!.name = req.body.name || req.game!.name;
  if (req.game!.status === 'setup' && req.body.status === 'in progress') {
    console.log(`Starting game ${req.game!.id} - assigning challenges`);
    const results = await assignChallenges(req.game!);
    if (!results[0]) {
      console.log('Cannot start game - not every participant has 2 or more challenges');
      return res.status(406).send({ message: 'Not every participant has 2 or more challenges' });
    }
    req.game!.status = 'in progress';
    [, emailsInfo] = results;
    console.log(`Game ${req.game!.id} started - challenges assigned to ${emailsInfo.length} participants`);
  }
  await req.game!.save();
  console.log(`Game ${req.game!.id} updated successfully`);
  const { participants: _participants, ...rest } = req.game!.toJSON();
  res.status(200).send({ game: rest });
  if (emailsInfo) {
    return Promise.all(emailsInfo.map(async (e) => {
      await sendGameStartedEmail(req.game!, e.killer, e.participant, e.challengeDescription);
    }));
  }
  return null;
});

router.delete('/:gameId', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, checkOwner, async (req: Request, res: Response) => {
  console.log(`Deleting game ${req.params.gameId}`);
  await req.game!.destroy();
  console.log(`Game ${req.params.gameId} deleted successfully`);
  return res.status(204).send();
});

export = router;
