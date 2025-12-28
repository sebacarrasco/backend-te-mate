import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import '../types/express'; // Import for global type extension

export const findUsers = async (
  req: Request<object, object, { userIds: string[] }>,
  res: Response,
  next: NextFunction,
) => {
  console.log(`Finding users for game creation, received ${req.body.userIds?.length || 0} user IDs`);
  if (req.body.userIds.length < 2) {
    console.log('Not enough participants');
    return res.status(406).send({ message: 'There should be at least 2 other participants' });
  }
  const userIds = [...req.body.userIds, req.currentUser.id];
  const users = await req.orm.User.findAll({
    where: {
      id: {
        [Op.in]: userIds,
      },
      active: true,
    },
  });
  if (users.length !== userIds.length) {
    console.log(`User count mismatch - expected ${userIds.length} found ${users.length}`);
    return res.status(404).send({ message: 'Not every user was found' });
  }
  req.users = users;
  console.log(`All ${users.length} users found successfully`);
  return next();
};

export const findGame = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`Looking for game with id ${req.params.gameId}`);
  const game = await req.orm.Game.findByPk(req.params.gameId);
  if (!game) {
    console.log('Game not found');
    return res.status(404).send({ message: 'Game not found' });
  }
  req.game = game;
  return next();
};

export const checkGameUser = async (req: Request, res: Response, next: NextFunction) => {
  const gameUser = await req.orm.GameUser.findOne({
    where: { gameId: req.game.id, userId: req.currentUser.id },
  });
  if (!gameUser) {
    console.log(`User ${req.currentUser.id} is not a game user of game ${req.game.id}`);
    return res.status(401).send({ message: 'You are not part of this game' });
  }
  return next();
};

export const checkOwner = (req: Request, res: Response, next: NextFunction) => {
  if (req.game.ownerId !== req.currentUser.id) {
    console.log(`User ${req.currentUser.id} does not own game (owner: ${req.game.ownerId})`);
    return res.status(403).send({ message: 'Access denied: you cannot modify a game unless you own it' });
  }
  console.log('Access granted - user is the owner');
  return next();
};

export const checkGameParams = (req: Request<object, object, {
  name?: string;
  status?: string;
}>, res: Response, next: NextFunction) => {
  if (!req.body.name && !req.body.status) {
    console.log('Missing required params - body should contain name or status');
    return res.status(400).send({
      ok: false,
      errors: {
        body: {
          msg: 'body should contain a name or status property',
          param: 'body',
          location: 'body',
        },
      },
    });
  }
  return next();
};

export const checkName = (req: Request<object, object, {
  name?: string;
}>, res: Response, next: NextFunction) => {
  const newName = req.body.name;
  if (newName !== undefined) {
    if (typeof newName !== 'string' || newName.length < 2) {
      console.log('Invalid game name');
      return res.status(400).send({
        ok: false,
        errors: {
          name: {
            msg: 'name should be a string of at least 2 characters long',
            param: 'name',
            location: 'body',
          },
        },
      });
    }
  }
  return next();
};

export const checkStatus = (req: Request<object, object, {
  status?: string;
}>, res: Response, next: NextFunction) => {
  if (req.body.status) {
    if (!['setup', 'in progress', 'completed'].includes(req.body.status)) {
      console.log('Invalid game status');
      return res.status(400).send({
        ok: false,
        errors: {
          name: {
            msg: "status should be one of the following values: 'setup', 'in progress' or 'completed'",
            param: 'status',
            location: 'body',
          },
        },
      });
    }
  }
  return next();
};
