import { sql } from "drizzle-orm";
import { boolean, timestamp, varchar } from "drizzle-orm/pg-core";

import { createTable } from "../config";
import { notificationEventType, resourceType } from "../enums";
import { documentReviews, documents } from "./documents";
import { conversations, messages } from "./messages";
import { users } from "./users";

export const notifications = createTable(
  "notification",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    senderId: varchar("sender_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: varchar("recipient_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: notificationEventType("event_type").notNull(),
    resourceType: resourceType("resource_type").notNull(),
    messageId: varchar("message_id", { length: 255 }).references(() => messages.id, { onDelete: "cascade" }),
    documentId: varchar("document_id", { length: 255 }).references(() => documents.id, { onDelete: "cascade" }),
    conversationId: varchar("conversation_id", { length: 255 }).references(() => conversations.id, {
      onDelete: "cascade"
    }),
    documentReviewId: varchar("document_review_id", { length: 255 }).references(() => documentReviews.id, {
      onDelete: "cascade"
    }),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    resourceIdCheck: sql`CHECK (
      (${table.resourceType} = 'message' AND ${table.messageId} IS NOT NULL AND ${table.documentId} IS NULL AND ${table.conversationId} IS NULL AND ${table.documentReviewId} IS NULL) OR
      (${table.resourceType} = 'document' AND ${table.messageId} IS NULL AND ${table.documentId} IS NOT NULL AND ${table.conversationId} IS NULL AND ${table.documentReviewId} IS NULL) OR
      (${table.resourceType} = 'conversation' AND ${table.messageId} IS NULL AND ${table.documentId} IS NULL AND ${table.conversationId} IS NOT NULL AND ${table.documentReviewId} IS NULL) OR
      (${table.resourceType} = 'document_review' AND ${table.messageId} IS NULL AND ${table.documentId} IS NULL AND ${table.conversationId} IS NULL AND ${table.documentReviewId} IS NOT NULL)
    )`
  })
);
