import { Request, Response, NextFunction } from 'express';
import '../types/express'; // Import for global type extension

export const findUser = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.userId || req.body.userId;
  try {
    const user = await req.orm.User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'kills', 'createdAt', 'active'],
    });
    if (user === null || !user.active) {
      console.log(`User ${userId} not found or inactive`);
      return res.status(404).send({ message: 'User not found' });
    }
    req.user = user;
    return next();
  } catch (error) {
    const err = error as Error;
    console.error(`Error finding user - ${err.message}`);
    return res.status(500).send();
  }
};
