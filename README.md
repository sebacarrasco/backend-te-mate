# Backend Te Maté

## Instructions for running in local environment
- `cp .env.example .env`.
- Complete the environment variables in the `.env` file.
- `yarn install`.
- `yarn start` for production, `yarn dev` for development.

## Linting
- Just linting: `yarn lint`.
- Linting and fix: `yarn lint-fix`.

## Database
The following command undo all migrations, do all migrations and seed the database: `yarn db:reset`

## Production migrations
To migrate the railway database:
- `railway link` and select `"Te mate"`
- `railway run yarn sequelize-cli db:migrate` this has to be run after `yarn install` locally.

## Docs
https://documenter.getpostman.com/view/11756316/UVXkoasU