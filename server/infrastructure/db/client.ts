import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getRuntimeConfig } from "../../config/runtimeConfig";
import * as schema from "./schema";

let pool: Pool | undefined;
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (database) return database;

  const { server } = getRuntimeConfig();
  pool = new Pool({ connectionString: server.databaseUrl });
  database = drizzle(pool, { schema });
  return database;
}

export async function closeDbConnection() {
  await pool?.end();
  pool = undefined;
  database = undefined;
}

export { schema };
