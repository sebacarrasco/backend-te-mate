const { execSync } = require('child_process');
const path = require('path');
const orm = require('../../src/models');

const projectRoot = path.resolve(__dirname, '../..');

beforeAll(async () => {
  try {
    execSync('npx sequelize-cli db:migrate:undo:all --env test', {
      cwd: projectRoot,
      stdio: 'pipe',
    });
  } catch (e) {
    console.error('Error running migrations:', e.message);
  }

  execSync('npx sequelize-cli db:migrate --env test', {
    cwd: projectRoot,
    stdio: 'pipe',
  });
});

afterAll(async () => {
  await orm.sequelize.close();
});
