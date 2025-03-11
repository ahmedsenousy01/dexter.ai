import { sql } from "drizzle-orm";
import { index, integer, primaryKey, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

import { createTable } from "../config";

/**
 * Next-Auth Schema Configuration:
 * - Using JWT strategy for authentication (no sessions table needed)
 * - OAuth authentication only (no email/password sign-in)
 * - No verification tokens needed (not using email verification)
 * - Custom users and accounts tables with additional fields
 */

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true
  }),
  image: varchar("image", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
});

export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 })
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId]
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId)
  })
);
