import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

import { env } from "@/env";

import * as enums from "./schema/enums";
// Import relations last since they depend on tables
import "./schema/relations";
import * as tables from "./schema/tables";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: typeof sql | undefined;
};
const conn = globalForDb.conn ?? sql;
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema: { ...tables, ...enums } });
