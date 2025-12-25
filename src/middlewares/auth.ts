import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import '../types/express'; // Import for global type extension

export const emailToLowerCase = (req: Request, res: Response, next: NextFunction) => {
  if (req.body?.email) {
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
  const redirectToInvalid = () => res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);

  let decoded;
  try {
    decoded = jwt.verify(req.params.token, process.env.JWT_SECRET as string) as { sub: string };
  } catch {
    console.log('Token verification failed - invalid token');
    return redirectToInvalid();
  }

  const { sub } = decoded;
  console.log(`Token verified, looking up user with id ${sub}`);
  const user = await req.orm.User.findByPk(sub);

  if (!user) {
    console.log('Token verification failed - user not found');
    return redirectToInvalid();
  }
  if (user.active) {
    console.log('Token verification failed - user is already active');
    return redirectToInvalid();
  }

  req.currentUser = user;
  return next();
};

export const setCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  const respondWithInvalidToken = () => res.status(401).send({ message: 'Invalid token' });

  const { auth } = req;
  if (!auth?.sub) {
    console.log('Authentication failed - no auth data');
    return respondWithInvalidToken();
  }

  const { sub } = auth;
  console.log(`Looking up user with id ${sub}`);
  const user = await req.orm.User.findByPk(sub);

  if (!user) {
    console.log('Authentication failed - user not found');
    return respondWithInvalidToken();
  }
  if (!user.active) {
    console.log('Authentication failed - user is not active');
    return respondWithInvalidToken();
  }

  req.currentUser = user;
  return next();
};
