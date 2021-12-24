require('dotenv').config();
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface) => {
    const usersArray = [];

    const commonData = {
      createdAt: new Date(),
      updatedAt: new Date(),
      password: bcrypt.hashSync('123456', parseInt(process.env.PASSWORD_SALT_ROUNDS, 10)),
    };

    usersArray.push({
      id: '843514fd-12aa-4b87-845a-97e51800b40b',
      firstName: 'Sebastián',
      lastName: 'Carrasco',
      email: 'sebacarrasco@uc.cl',
      active: true,
      ...commonData,
    });

    usersArray.push({
      id: '8bc3461d-2c03-4c53-9836-0033093fd3ee',
      firstName: 'Cristiano',
      lastName: 'Ronaldo',
      email: 'cr7@uc.cl',
      active: true,
      ...commonData,
    });

    usersArray.push({
      id: 'd70a1bb9-cea9-4987-8871-8fcc1b74fd0a',
      firstName: 'Lionel',
      lastName: 'Messi',
      email: 'messirve@uc.cl',
      active: true,
      ...commonData,
    });

    usersArray.push({
      id: 'c874b04c-f8e4-4503-ac9c-9b60658b9f5f',
      firstName: 'Robert',
      lastName: 'Lewandowski',
      email: 'lewa@uc.cl',
      active: true,
      ...commonData,
    });

    usersArray.push({
      id: 'f8cb6bbb-f417-4cd3-9541-aef279d8fb3e',
      firstName: 'Francesco',
      lastName: 'Totti',
      email: 'totti@uc.cl',
      active: false,
      ...commonData,
    });

    await queryInterface.bulkInsert('Users', usersArray);
  },

  down: (queryInterface) => queryInterface.bulkDelete('Users', null),
};
