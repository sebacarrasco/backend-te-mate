import {
  AssignedChallengeModel, GameModel, GameUserModel, UserModel,
} from '../types/models';
import { ORM } from '../types/orm';

export const killUser = async (orm: ORM, userId: string, game: GameModel) => {
  // Complete challenge where the victim was killed
  const challengeToBeCompleted = await orm.AssignedChallenge.findOne({
    where: {
      gameId: game.id,
      victimId: userId,
      isCompleted: false,
      isCancelled: false,
    },
  }) as AssignedChallengeModel;
  challengeToBeCompleted.isCompleted = true;
  await challengeToBeCompleted.save();
  console.log(`Marked challenge ${challengeToBeCompleted.id} as completed`);

  const gameUsers = await orm.GameUser.findAll({
    where: { gameId: game.id, userId: [challengeToBeCompleted.killerId, challengeToBeCompleted.victimId] },
  });

  // Add kill to user in User and GameUser
  const killerGameUser = gameUsers.find((gu) => gu.userId === challengeToBeCompleted.killerId) as GameUserModel;
  killerGameUser.kills += 1;
  await killerGameUser.save();
  console.log(`Incremented kills for game user ${killerGameUser.id} to ${killerGameUser.kills}`);
  const killerUser = await orm.User.findByPk(challengeToBeCompleted.killerId) as UserModel;
  killerUser.kills += 1;
  await killerUser.save();
  console.log(`Incremented kills for user ${killerUser.id} to ${killerUser.kills}`);

  // Set victim as dead in GameUser
  const victimGameUser = gameUsers.find((gu) => gu.userId === challengeToBeCompleted.victimId) as GameUserModel;
  victimGameUser.isAlive = false;
  await victimGameUser.save();
  console.log(`Set user with id ${userId} as dead (GameUser id ${victimGameUser.id})`);

  // Get the challenge were the victim was the killer and cancel it
  const challengeWhereVictimWasKiller = await orm.AssignedChallenge.findOne({
    where: {
      gameId: game.id,
      killerId: userId,
      isCompleted: false,
      isCancelled: false,
    },
  }) as AssignedChallengeModel;

  challengeWhereVictimWasKiller.isCancelled = true;
  await challengeWhereVictimWasKiller.save();
  console.log(`Marked challenge ${challengeWhereVictimWasKiller.id} as cancelled`);

  // If the victim was the killer, the game is completed, the circle is completed
  if (challengeWhereVictimWasKiller.victimId === killerUser.id) {
    console.log('The game is completed, the circle is completed');
    game.status = 'completed';
    await game.save();
    return;
  }

  // Assign a new challenge for the killer based on the challenge where the victim was the killer
  const newAssignedChallenge = await orm.AssignedChallenge.create({
    gameId: game.id,
    killerId: killerUser.id,
    victimId: challengeWhereVictimWasKiller.victimId,
    challengeId: challengeWhereVictimWasKiller.challengeId,
  });
  console.log(`
    Assigned new challenge ${newAssignedChallenge.id} for killer ${killerUser.id}
    based on challenge ${challengeWhereVictimWasKiller.id}
    for victim ${challengeWhereVictimWasKiller.victimId}
  `);
};
