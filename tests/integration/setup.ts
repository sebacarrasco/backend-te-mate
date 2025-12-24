import orm from '../../src/models';

afterAll(async () => {
  await orm.sequelize.close();
});
