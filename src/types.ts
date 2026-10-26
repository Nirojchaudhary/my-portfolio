export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_TOKEN: string;
};

export type Variables = {
  admin: boolean;
};

export type AppEnv = {
  Bindings: Env;
  Variables: Variables;
};