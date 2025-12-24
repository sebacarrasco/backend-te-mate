export interface DatabaseConfig {
  username?: string;
  password?: string;
  database: string;
  host?: string;
  dialect: string;
  use_env_variable?: string;
  extend?: string;
}

export interface DatabaseConfigMap {
  [key: string]: DatabaseConfig;
}
