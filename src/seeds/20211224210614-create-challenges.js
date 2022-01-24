require('dotenv').config();

module.exports = {
  up: async (queryInterface) => {
    const challengesArray = [];

    const commonData = {
      createdAt: new Date(),
      updatedAt: new Date(),
      selected: false,
    };

    challengesArray.push({
      userId: '843514fd-12aa-4b87-845a-97e51800b40b',
      description: 'Lick the floor',
      ...commonData,
      selected: true,
    });

    challengesArray.push({
      userId: '843514fd-12aa-4b87-845a-97e51800b40b',
      description: 'Spit at himself',
      ...commonData,
    });

    challengesArray.push({
      userId: '843514fd-12aa-4b87-845a-97e51800b40b',
      description: 'Puke',
      ...commonData,
    });

    challengesArray.push({
      userId: '8bc3461d-2c03-4c53-9836-0033093fd3ee',
      description: 'Give away the ball',
      ...commonData,
    });

    challengesArray.push({
      userId: '8bc3461d-2c03-4c53-9836-0033093fd3ee',
      description: 'Admit Messi is the best',
      ...commonData,
    });

    challengesArray.push({
      userId: '8bc3461d-2c03-4c53-9836-0033093fd3ee',
      description: 'Not score a goal from a penalty',
      ...commonData,
    });

    challengesArray.push({
      userId: 'd70a1bb9-cea9-4987-8871-8fcc1b74fd0a',
      description: 'Win a world cup',
      ...commonData,
    });

    challengesArray.push({
      userId: 'd70a1bb9-cea9-4987-8871-8fcc1b74fd0a',
      description: 'Not give away the ball',
      ...commonData,
    });

    challengesArray.push({
      userId: 'd70a1bb9-cea9-4987-8871-8fcc1b74fd0a',
      description: 'Admit CR7 is the best',
      ...commonData,
    });

    challengesArray.push({
      userId: 'c874b04c-f8e4-4503-ac9c-9b60658b9f5f',
      description: '',
      ...commonData,
    });

    challengesArray.push({
      userId: 'c874b04c-f8e4-4503-ac9c-9b60658b9f5f',
      description: 'Not score a goal in a match',
      ...commonData,
    });

    challengesArray.push({
      userId: 'c874b04c-f8e4-4503-ac9c-9b60658b9f5f',
      description: 'Admit Halaand is the best',
      ...commonData,
    });

    challengesArray.push({
      userId: 'c874b04c-f8e4-4503-ac9c-9b60658b9f5f',
      description: 'Not win the Bundesliga',
      ...commonData,
    });

    await queryInterface.bulkInsert('Challenges', challengesArray);
  },

  down: (queryInterface) => queryInterface.bulkDelete('Challenges', null),
};
