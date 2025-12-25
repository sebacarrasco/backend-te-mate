import express, { Request, Response } from 'express';
import { expressjwt } from 'express-jwt';
import { check } from 'express-validator';
import { setCurrentUser } from '../middlewares/auth';
import { challengeOwnerNotCurrentUser } from '../middlewares/challenges';
import { fieldValidator } from '../middlewares/field-validator';
import { findUser } from '../middlewares/users';
import { UserModel } from '../types/models';
import '../types/express'; // Import for global type extension

const router = express.Router();
router.use(expressjwt({ secret: process.env.JWT_SECRET as string, algorithms: ['HS256'] }));
router.use(setCurrentUser);

router.get('/', async (req: Request, res: Response) => {
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
], findUser, async (req: Request, res: Response) => {
  console.log(`Fetching user ${req.params.userId}`);
  return res.status(200).send({ user: req.user });
});

router.get('/:userId/challenges', [
  check('userId', 'userId must be an uuid').isUUID(),
  fieldValidator,
], findUser, challengeOwnerNotCurrentUser, async (req: Request, res: Response) => {
  console.log(`Fetching challenges for user ${req.params.userId}`);
  const challenges = await req.orm.Challenge.findAll({
    where: { userId: req.user!.id },
    order: [['updatedAt', 'DESC']],
  });
  console.log(`Found ${challenges.length} challenges for user ${req.user!.id}`);
  const user = req.user as UserModel;
  return res.status(200).send({ user: { ...user.toJSON(), challenges } });
});

export = router;
