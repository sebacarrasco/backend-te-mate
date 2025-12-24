import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import '../types/express'; // Import for global type extension
import { GameWithParticipants } from '../types/models';

export const findUsers = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`Finding users for game creation, received ${req.body.userIds?.length || 0} user IDs`);
  if (req.body.userIds.length < 2) {
    console.log('Not enough participants');
    return res.status(406).send({ message: 'There should be at least 2 other participants' });
  }
  const userIds = [...req.body.userIds, req.currentUser!.id];
  try {
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
  } catch (error) {
    const err = error as Error;
    console.error(`Error finding users - ${err.message}`);
    return res.status(400).send({ message: 'Invalid syntax for type uuid' });
  }
};

export const findGame = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`Looking for game with id ${req.params.gameId}`);
  try {
    const game = await req.orm.Game.findByPk(req.params.gameId, {
      include: [
        {
          model: req.orm.User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email', 'kills'],
        },
        {
          model: req.orm.User,
          as: 'participants',
          attributes: ['id', 'firstName', 'lastName', 'email', 'kills'],
          through: { attributes: ['id', 'alive', 'kills', 'gameId', 'userId'] },
          include: [{ model: req.orm.Challenge, where: { selected: { [Op.eq]: false } } }],
        },
      ],
    }) as GameWithParticipants | null;
    if (!game) {
      console.log('Game not found');
      return res.status(404).send({ message: 'Game not found' });
    }
    req.game = game;
    console.log(`Game ${req.game.name} found with ${req.game.participants.length} participants`);
    if (!req.game.participants.map((p) => p.id).includes(req.currentUser!.id)) {
      console.log(`User ${req.currentUser!.id} is not a participant of game ${req.game.id}`);
      return res.status(401).send({ message: 'You are not part of this game' });
    }
    return next();
  } catch (error) {
    const err = error as Error;
    console.error(`Error finding game - ${err.message}`);
    return res.status(500).send();
  }
};

export const checkOwner = async (req: Request, res: Response, next: NextFunction) => {
  if (req.game!.ownerId !== req.currentUser!.id) {
    console.log(`User ${req.currentUser!.id} does not own game (owner: ${req.game!.ownerId})`);
    return res.status(403).send({ message: 'Access denied: you cannot modify a game unless you own it' });
  }
  console.log('Access granted - user is the owner');
  return next();
};

export const checkGameParams = (req: Request, res: Response, next: NextFunction) => {
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

export const checkName = async (req: Request, res: Response, next: NextFunction) => {
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

export const checkStatus = async (req: Request, res: Response, next: NextFunction) => {
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

export const findVictim = async (req: Request, res: Response, next: NextFunction) => {
  if (req.game!.status === 'in progress') {
    console.log(`Finding victim for user ${req.currentUser!.id} in game ${req.game!.id}`);
    try {
      const currentParticipant = req.game!.participants.filter(
        (p) => p.id === req.currentUser!.id,
      )[0];
      const victimParticipant = await req.orm.Participant.findOne({
        where: { participantKillerId: currentParticipant.Participant.id },
        attributes: ['id', 'userId'],
      });
      if (!victimParticipant) {
        console.error('No victim participant found');
        return res.status(500).send();
      }
      req.victimUser = await req.orm.User.findByPk(victimParticipant.userId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'kills'],
      }) ?? undefined;
      req.challenge = await req.orm.Challenge.findOne({
        where: { participantId: victimParticipant.id, selected: true }, attributes: ['description'],
      }) ?? undefined;
      console.log(`Victim user ${req.victimUser?.firstName} ${req.victimUser?.lastName} and challenge loaded`);
      return next();
    } catch (error) {
      const err = error as Error;
      console.error(`Error finding victim - ${err.message}`);
      return res.status(500).send();
    }
  }
  return next();
};
