require('dotenv').config();

module.exports = {
  up: async (queryInterface) => {
    const participantsArray = [];

    const commonData = {
      createdAt: new Date(),
      updatedAt: new Date(),
      alive: true,
      kills: 0,
    };

    for (let gameId = 1; gameId < 5; gameId += 1) {
      participantsArray.push({
        userId: '843514fd-12aa-4b87-845a-97e51800b40b',
        gameId,
        ...commonData,
      });
      participantsArray.push({
        userId: '8bc3461d-2c03-4c53-9836-0033093fd3ee',
        gameId,
        ...commonData,
      });
      participantsArray.push({
        userId: 'd70a1bb9-cea9-4987-8871-8fcc1b74fd0a',
        gameId,
        ...commonData,
      });
    }

    await queryInterface.bulkInsert('Participants', participantsArray);
  },

  down: (queryInterface) => queryInterface.bulkDelete('Participants', null),
};
