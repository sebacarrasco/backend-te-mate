import express, { Request, Response } from 'express';
import { expressjwt } from 'express-jwt';
import { check } from 'express-validator';
import { setCurrentUser } from '../middlewares/auth';
import { challengeOwnerNotCurrentUser, findChallenge } from '../middlewares/challenges';
import { fieldValidator } from '../middlewares/field-validator';
import { findUser } from '../middlewares/users';
import '../types/express'; // Import for global type extension

const router = express.Router();
router.use(expressjwt({ secret: process.env.JWT_SECRET as string, algorithms: ['HS256'] }));
router.use(setCurrentUser);

router.post('/', [
  check('userId', 'userId must be an uuid').isUUID(),
  check('description', 'description should be a string').isString(),
  check('description', 'description should be at least 5 characters long').isLength({ min: 5 }),
  fieldValidator,
], findUser, challengeOwnerNotCurrentUser, async (req: Request, res: Response) => {
  console.log(`Creating challenge for user ${req.user!.id}`);
  const challenge = await req.orm.Challenge.create({
    userId: req.user!.id,
    description: req.body.description,
  });
  console.log(`Challenge ${challenge.id} created successfully for user ${req.user!.id}`);
  return res.status(201).send({ challenge });
});

router.patch('/:challengeId', [
  check('challengeId', 'challengeId must be an integer').isInt(),
  check('description', 'description should be a string').isString(),
  check('description', 'description should be at least 5 characters long').isLength({ min: 5 }),
  fieldValidator,
], findChallenge, challengeOwnerNotCurrentUser, async (req: Request, res: Response) => {
  console.log(`Updating challenge ${req.params.challengeId}`);
  req.challenge!.description = req.body.description;
  await req.challenge!.save();
  console.log(`Challenge ${req.challenge!.id} updated successfully`);
  return res.status(200).send({ challenge: req.challenge });
});

router.delete('/:challengeId', [
  check('challengeId', 'challengeId must be an integer').isInt(),
  fieldValidator,
], findChallenge, challengeOwnerNotCurrentUser, async (req: Request, res: Response) => {
  console.log(`Deleting challenge ${req.params.challengeId}`);
  await req.challenge!.destroy();
  console.log(`Challenge ${req.params.challengeId} deleted successfully`);
  return res.status(204).send();
});

export = router;
