import crypto from "crypto";
import { sql } from "drizzle-orm";
import { primaryKey, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { createTable } from "../config";
import { inviteStatus, teamRole } from "../enums";
import { users } from "./users";

export const teams = createTable(
  "teams",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    createdBy: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    uniqueNamePerUser: uniqueIndex("unique_team_name_per_user").on(table.name, table.createdBy)
  })
);

export const teamMembers = createTable(
  "team_members",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: varchar("team_id", { length: 255 })
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    role: teamRole("role").default("member").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.teamId] })
  })
);

export const teamInvites = createTable(
  "team_invites",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: varchar("team_id", { length: 255 })
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    invitedBy: varchar("invited_by", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: teamRole("role").default("member").notNull(),
    status: inviteStatus("status").default("pending").notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    uniqueTeamEmail: uniqueIndex("unique_team_invite").on(table.teamId, table.email)
  })
);
