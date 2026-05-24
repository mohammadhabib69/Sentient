export interface DatabaseRuntimeConfig {
  databaseUrl: string;
}

export function readDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseRuntimeConfig {
  return {
    databaseUrl: env.DATABASE_URL ?? "postgresql://sentient:sentient@localhost:5432/sentient",
  };
}
