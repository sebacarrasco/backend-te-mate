# Backend Te Maté

## Instructions for running in local environment
- `cp .env.example .env`.
- Complete the environment variables in the `.env` file.
- `yarn install`.
- `yarn db:reset` to set up the database.
- `yarn start` for production, `yarn dev` for development.

## Linting
- Just linting: `yarn lint`.
- Linting and fixasd: `yarn lint-fix`.

## Testing
This project uses Jest for testing. Make sure you have the test database (`te_mate_test`) created and run migrations before running tests:

```bash
# Run migrations for test database (only needed once or after schema changes)
npx sequelize-cli db:migrate --env test
```

```bash
# Run all tests
yarn test

# Run only unit tests
yarn test:unit

# Run only integration tests
yarn test:integration

# Run tests in watch mode
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

## Database
The following command undo all migrations, do all migrations and seed the database: `yarn db:reset`

## Docs
https://documenter.getpostman.com/view/11756316/UVXkoasU