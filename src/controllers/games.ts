import express, { Request, Response } from 'express';
import { expressjwt } from 'express-jwt';
import { check } from 'express-validator';
import { setCurrentUser } from '../middlewares/auth';
import { fieldValidator } from '../middlewares/field-validator';
import {
  findUsers, findGame, checkOwner, checkName, checkGameParams, checkStatus, checkGameUser, checkDeadGameUser,
} from '../middlewares/games';
import { assignChallenges } from '../utils/assign-challenges';
import sendGameStartedEmail = require('../mailers/game-started');
import '../types/express'; // Import for global type extension
import {
  AssignChallengesResult, ChallengeModel, GameUserModel, UserModel,
} from '../types/models';
import { mapGameResponse, mapParticipantResponse, mapUserResponse } from '../utils/mappers';
import { getCompletedAssignedChallenges, getOngoingAssignedChallenges, killUser } from '../business/game';

const router = express.Router();

router.use(expressjwt({ secret: process.env.JWT_SECRET as string, algorithms: ['HS256'] }));
router.use(setCurrentUser);

router.get('/', async (req: Request, res: Response) => {
  console.log(`Fetching games for user ${req.currentUser.id}`);
  const gameUsers = await req.orm.GameUser.findAll({ where: { userId: req.currentUser.id } });
  const games = await req.orm.Game.findAll({ where: { id: gameUsers.map((gu) => gu.gameId) } });
  const gameOwners = await req.orm.User.findAll({ where: { id: games.map((game) => game.ownerId) } });
  console.log(`Found ${games.length} games for user ${req.currentUser.id}`);
  return res.status(200).send({
    games: games.map((game) => mapGameResponse(
      game,
      gameUsers.find((gu) => gu.gameId === game.id) as GameUserModel,
      gameOwners.find((owner) => owner.id === game.ownerId) as UserModel,
    )),
  });
});

router.get('/:gameId', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, checkGameUser, async (req: Request<{gameId: string}, object, object>, res: Response) => {
  console.log(`Fetching game ${req.params.gameId} details`);
  const { game } = req;
  const gameUsers = await req.orm.GameUser.findAll({
    where: { gameId: game.id },
  });
  const currentUserGameUser = gameUsers.find((gu) => gu.userId === req.currentUser.id) as GameUserModel;
  const users = await req.orm.User.findAll({
    where: { id: gameUsers.map((gu) => gu.userId) },
  });
  const challengesNotSelected = await req.orm.Challenge.findAll({
    where: { userId: users.map((u) => u.id), selected: false },
  });
  const owner = users.find((u) => u.id === game.ownerId) as UserModel;
  const assignedChallenge = await req.orm.AssignedChallenge.findOne({
    where: {
      gameId: game.id,
      killerId: req.currentUser.id,
      isCompleted: false,
      isCancelled: false,
    },
  });
  const challenge = assignedChallenge ? await req.orm.Challenge.findByPk(
    assignedChallenge.challengeId,
  ) as ChallengeModel : null;
  const victim = assignedChallenge ? users.find(
    (u) => u.id === assignedChallenge.victimId,
  ) as UserModel : null;
  return res.status(200).send({
    game: {
      ...mapGameResponse(game, currentUserGameUser, owner),
      participants: users.map((user) => mapParticipantResponse(
        user,
        gameUsers.find((gu) => gu.userId === user.id) as GameUserModel,
        challengesNotSelected.filter((c) => c.userId === user.id).length,
      )),
      victim: victim ? mapUserResponse(victim) : null,
      challenge: challenge ? { description: challenge.description } : null,
    },
  });
});

router.post('/', [
  check('userIds', 'userIds must be an array of uuids').isArray(),
  check('userIds.*', 'userIds must be an array of uuids').isUUID(),
  check('name', 'name should be a string').isString(),
  check('name', 'name should be at least 2 characters long').isLength({ min: 2 }),
  fieldValidator,
], findUsers, async (req: Request<object, object, {
  userIds: string[];
  name: string;
}>, res: Response) => {
  console.log(`Creating game "${req.body.name}" with ${req.users.length} users`);
  const game = await req.orm.Game.create({
    ownerId: req.currentUser.id,
    name: req.body.name,
  });
  await req.orm.GameUser.bulkCreate(req.users.map((user) => ({
    userId: user.id,
    gameId: game.id,
    isAlive: true,
    kills: 0,
  })));
  await game.save();
  const currentUserGameUser = await req.orm.GameUser.findOne({
    where: { gameId: game.id, userId: req.currentUser.id },
  }) as GameUserModel;

  console.log(`Game ${game.id} created successfully`);
  return res.status(201).send({
    game: {
      ...mapGameResponse(game, currentUserGameUser, req.currentUser),
    },
  });
});

router.patch('/:gameId', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, checkOwner, checkGameParams, checkName, checkStatus, async (req: Request<{gameId: string}, object, {
    name: string;
    status: string;
  }>, res: Response) => {
  console.log(`Updating game ${req.params.gameId}`);
  let results: AssignChallengesResult | null = null;
  req.game.name = req.body.name || req.game.name;
  const gameUsers = await req.orm.GameUser.findAll({
    where: { gameId: req.game.id },
  });
  if (req.game.status === 'setup' && req.body.status === 'in progress') {
    console.log(`Starting game ${req.game.id} - assigning challenges`);
    const availableChallenges = await req.orm.Challenge.findAll({
      where: { userId: gameUsers.map((gu) => gu.userId), selected: false },
    });
    const challengesByUser = availableChallenges.reduce((acc, challenge) => {
      acc[challenge.userId] = acc[challenge.userId] || [];
      acc[challenge.userId].push(challenge);
      return acc;
    }, {} as Record<string, ChallengeModel[]>);
    if (Object.values(challengesByUser).some((challenges) => challenges.length < 2)) {
      console.log('Cannot start game - not every participant has 2 or more challenges');
      return res.status(406).send({ message: 'Not every participant has 2 or more challenges' });
    }
    const users = await req.orm.User.findAll({
      where: { id: gameUsers.map((gu) => gu.userId) },
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });
    results = await assignChallenges(req.orm, req.game, users, challengesByUser);
    req.game.status = 'in progress';
    console.log(`Game ${req.game.id} started - challenges assigned to ${results.length} participants`);
  }
  await req.game.save();
  console.log(`Game ${req.game.id} updated successfully`);
  res.status(200).send({
    game: {
      ...mapGameResponse(
        req.game,
        gameUsers.find((gu) => gu.userId === req.currentUser.id) as GameUserModel,
        req.currentUser,
      ),
    },
  });
  if (results) {
    return Promise.all(results.map(async (result) => {
      await sendGameStartedEmail(req.game, result.killer, result.victim, result.challengeDescription);
    }));
  }
  return null;
});

router.delete('/:gameId', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, checkOwner, async (req: Request<{gameId: string}, object, object>, res: Response) => {
  console.log(`Deleting game ${req.params.gameId}`);
  await req.game.destroy();
  console.log(`Game ${req.params.gameId} deleted successfully`);
  return res.status(204).send();
});

router.post('/:gameId/users/:userId/kill', [
  check('gameId', 'gameId must be an integer').isInt(),
  check('userId', 'userId must be an uuid').isUUID(),
  fieldValidator,
], findGame, checkOwner, async (req: Request<{gameId: string, userId: string}, object, object>, res: Response) => {
  console.log(`Killing user ${req.params.userId} in game ${req.params.gameId}`);
  await killUser(req.orm, req.params.userId, req.game);
  return res.status(200).send({
    message: 'User killed successfully',
  });
});

router.get('/:gameId/assigned-challenges/completed', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, checkGameUser, async (req: Request<{gameId: string}, object, object>, res: Response) => {
  console.log(`Fetching completed assigned challenges for game ${req.params.gameId}`);
  const assignedChallenges = await getCompletedAssignedChallenges(req.orm, req.game);
  console.log(`Found ${assignedChallenges.length} completed assigned challenges for game ${req.params.gameId}`);
  return res.status(200).send({
    assignedChallenges,
  });
});

router.get('/:gameId/assigned-challenges/ongoing', [
  check('gameId', 'gameId must be an integer').isInt(),
  fieldValidator,
], findGame, checkDeadGameUser, async (req: Request<{gameId: string}, object, object>, res: Response) => {
  console.log(`Fetching ongoing assigned challenges for game ${req.params.gameId}`);
  const assignedChallenges = await getOngoingAssignedChallenges(req.orm, req.game);
  console.log(`Found ${assignedChallenges.length} ongoing assigned challenges for game ${req.params.gameId}`);
  return res.status(200).send({
    assignedChallenges,
  });
});

export = router;
