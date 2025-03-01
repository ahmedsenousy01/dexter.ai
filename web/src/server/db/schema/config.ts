import { pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This creates a PostgreSQL table with the given name prefixed with "dexter_".
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `dexter_${name}`);
