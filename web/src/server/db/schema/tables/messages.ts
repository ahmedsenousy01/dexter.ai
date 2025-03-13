import crypto from "crypto";
import { sql } from "drizzle-orm";
import { index, primaryKey, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { createTable } from "../config";
import { conversationType } from "../enums";
import { teams } from "./teams";
import { users } from "./users";

export const conversations = createTable(
  "conversations",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: conversationType("type").notNull(),
    teamId: varchar("team_id", { length: 255 }).references(() => teams.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  () => ({
    teamConstraint: sql`CHECK ((type = 'team' AND team_id IS NOT NULL) OR (type IN ('private', 'ai') AND team_id IS NULL))`
  })
);

export const conversationParticipants = createTable(
  "conversation_participants",
  {
    conversationId: varchar("conversation_id", { length: 255 })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.conversationId, table.userId] })
  })
);

export const messages = createTable(
  "messages",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: varchar("conversation_id", { length: 255 })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: varchar("sender_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
    senderIdIdx: index("messages_sender_id_idx").on(table.senderId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt)
  })
);

export const messageMentions = createTable(
  "message_mentions",
  {
    messageId: varchar("message_id", { length: 255 })
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    mentionedUserId: varchar("mentioned_user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.mentionedUserId] })
  })
);

export const conversationMentions = createTable(
  "conversation_mentions",
  {
    messageId: varchar("message_id", { length: 255 })
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    mentionedConversationId: varchar("mentioned_conversation_id", { length: 255 })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.mentionedConversationId] })
  })
);
