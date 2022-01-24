require('dotenv').config();

module.exports = {
  up: async (queryInterface) => {
    const gamesArray = [];

    const commonData = {
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    gamesArray.push({
      ownerId: '843514fd-12aa-4b87-845a-97e51800b40b',
      name: 'Vichuquen 2022',
      status: 'setup',
      ...commonData,
    });

    gamesArray.push({
      ownerId: '8bc3461d-2c03-4c53-9836-0033093fd3ee',
      name: 'Vichuquen 2023',
      status: 'setup',
      ...commonData,
    });

    gamesArray.push({
      ownerId: '843514fd-12aa-4b87-845a-97e51800b40b',
      name: 'Algaporro 2022',
      status: 'setup',
      ...commonData,
    });

    gamesArray.push({
      ownerId: '8bc3461d-2c03-4c53-9836-0033093fd3ee',
      name: 'Algaporro 2023',
      status: 'setup',
      ...commonData,
    });

    await queryInterface.bulkInsert('Games', gamesArray);
  },

  down: (queryInterface) => queryInterface.bulkDelete('Games', null),
};
