import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import '../types/express'; // Import for global type extension

export const emailToLowerCase = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase();
  }
  return next();
};

export const emailIsUnique = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`Checking if email "${req.body.email}" is unique`);
  const user = await req.orm.User.findOne({ where: { email: req.body.email, active: true } });
  if (user) {
    console.log(`Email "${req.body.email}" already exists`);
    return res.status(409).send({ message: 'An account associated with this email already exists' });
  }
  return next();
};

export const setCurrentUserURLToken = async (req: Request, res: Response, next: NextFunction) => {
  console.log('Verifying URL token');
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET as string) as { sub: string };
    const { sub } = decoded;
    console.log(`Token verified, looking up user with id ${sub}`);
    const user = await req.orm.User.findByPk(sub);
    if (user === null) { throw new Error('User not found'); }
    if (user.active) { throw new Error('User is already active'); }
    req.currentUser = user;
    return next();
  } catch (error) {
    const err = error as Error;
    console.log(`Token verification failed - ${err.message}`);
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);
  }
};

export const setCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auth } = req;
    if (!auth?.sub) { throw new Error('No auth data'); }
    const { sub } = auth;
    console.log(`Looking up user with id ${sub}`);
    const user = await req.orm.User.findByPk(sub);
    if (user === null) { throw new Error('User not found'); }
    if (!user.active) { throw new Error('User is not active'); }
    req.currentUser = user;
    return next();
  } catch (error) {
    const err = error as Error;
    console.log(`Authentication failed - ${err.message}`);
    return res.status(401).send({ message: 'Invalid token' });
  }
};
