const orm = require('../../src/models');

afterAll(async () => {
  await orm.sequelize.close();
});
