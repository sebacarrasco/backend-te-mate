import { Op } from 'sequelize';
import {
  EmailInfo,
  AssignChallengesResult,
  UserModel,
  ChallengeModel,
  AssignedChallengeCreationAttributes,
  GameModel,
} from '../types/models';
import { ORM } from '../types/orm';

export const assignChallenges = async (
  orm: ORM,
  game: GameModel,
  users: UserModel[],
  challengesByUser: Record<string, ChallengeModel[]>,
): Promise<AssignChallengesResult> => {
  const usersInRandomOrder = [...users].sort(() => Math.random() - 0.5);
  const assignationResults: EmailInfo[] = [];
  const selectedChallenges: ChallengeModel[] = [];
  const assignedChallenges: AssignedChallengeCreationAttributes[] = [];

  usersInRandomOrder.forEach((killer, index) => {
    const victim = index === usersInRandomOrder.length - 1 ? usersInRandomOrder[0] : usersInRandomOrder[index + 1];
    const victimChallenges = challengesByUser[victim.id];
    const challenge = victimChallenges[
      Math.floor(Math.random() * victimChallenges.length)
    ];
    selectedChallenges.push(challenge);
    const assignedChallenge = {
      gameId: game.id,
      killerId: killer.id,
      victimId: victim.id,
      challengeId: challenge.id,
    };
    assignedChallenges.push(assignedChallenge);
    assignationResults.push({
      killer,
      victim,
      challengeDescription: challenge.description,
    });
  });

  await updateSelectedChallenges(orm, selectedChallenges);
  await orm.AssignedChallenge.bulkCreate(assignedChallenges);
  return assignationResults;
};

const updateSelectedChallenges = async (orm: ORM, challenges: ChallengeModel[]): Promise<void> => {
  await orm.Challenge.update({
    selected: true,
  }, { where: { id: { [Op.in]: challenges.map((c) => c.id) } } });
};
