/* eslint-disable import/no-import-module-exports */
import 'dotenv/config';
import { Dialect } from 'sequelize';

interface DatabaseConfig {
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  dialect?: Dialect;
  use_env_variable?: string;
  extend?: string;
}

interface ConfigMap {
  [key: string]: DatabaseConfig;
}

const config: ConfigMap = {
  default: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect: (process.env.DB_DIALECT || 'postgres') as Dialect,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || '127.0.0.1',
  },
  development: {
    extend: 'default',
    database: process.env.DB_NAME || 'te_mate_dev',
  },
  test: {
    extend: 'default',
    database: 'te_mate_test',
  },
  production: {
    extend: 'default',
    use_env_variable: 'DATABASE_URL',
  },
};

Object.keys(config).forEach((configKey) => {
  const configValue = config[configKey];
  if (configValue.extend) {
    config[configKey] = { ...config[configValue.extend], ...configValue };
  }
});

export default config;

// CommonJS export for Sequelize CLI compatibility
module.exports = config;
