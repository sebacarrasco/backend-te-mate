import { Request, Response, NextFunction } from 'express';
import '../types/express'; // Import for global type extension
import { UserModel } from '../types';

export const challengeOwnerNotCurrentUser = (req: Request, res: Response, next: NextFunction) => {
  console.log(`Checking if user ${req.currentUser.id} is different from challenge owner ${req.user.id}`);
  if (req.currentUser.id === req.user.id) {
    return res.status(403).send({ message: 'Access denied: you cannot access your own challenges' });
  }
  return next();
};

export const findChallenge = async (
  req: Request<{challengeId: string}, object, object>,
  res: Response,
  next: NextFunction,
) => {
  console.log(`Looking for challenge with id ${req.params.challengeId}`);
  const challenge = await req.orm.Challenge.findByPk(req.params.challengeId);
  if (!challenge) {
    return res.status(404).send({ message: 'Challenge not found' });
  }
  req.challenge = challenge;
  req.user = await req.orm.User.findByPk(challenge.userId) as UserModel;
  console.log(`Challenge found, belongs to user ${challenge.userId}`);
  return next();
};
