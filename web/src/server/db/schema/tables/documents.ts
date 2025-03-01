import crypto from "crypto";
import { sql } from "drizzle-orm";
import { boolean, index, primaryKey, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { createTable } from "../config";
import { accessLevel, documentStatus, fileType, reviewStatus, reviewerStatus } from "../enums";
import { messages } from "./messages";
import { teams } from "./teams";
import { users } from "./users";

export const documentVersions = createTable(
  "document_versions",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    documentId: varchar("document_id", { length: 255 }).notNull(), // No reference here - will add later
    version: text("version").notNull(),
    filePath: text("file_path").notNull(),
    fileType: fileType("file_type").notNull(),
    fileSizeBytes: text("file_size_bytes").notNull(),
    createdBy: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    // Enforce semantic versioning format (major.minor.patch)
    versionFormatCheck: sql`CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$')`
  })
);

export const documents = createTable("documents", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  ownerId: varchar("owner_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currentVersionId: varchar("current_version_id", { length: 255 })
    .notNull()
    .references(() => documentVersions.id, { onDelete: "cascade" }),
  isAiGenerated: boolean("is_ai_generated").default(false),
  status: documentStatus("status").default("draft").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
});

export const documentAccess = createTable(
  "document_access",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    documentId: varchar("document_id", { length: 255 })
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }),
    teamId: varchar("team_id", { length: 255 }).references(() => teams.id, { onDelete: "cascade" }),
    accessLevel: accessLevel("access_level").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    accessLevelCheck: index("document_access_level_check").on(table.accessLevel),
    userTeamConstraint: sql`CHECK ((user_id IS NOT NULL AND team_id IS NULL) OR (user_id IS NULL AND team_id IS NOT NULL))`,
    documentIdIdx: index("document_access_document_id_idx").on(table.documentId),
    userIdIdx: index("document_access_user_id_idx").on(table.userId),
    teamIdIdx: index("document_access_team_id_idx").on(table.teamId)
  })
);

export const documentReviewers = createTable(
  "document_reviewers",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    documentId: varchar("document_id", { length: 255 })
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    reviewerId: varchar("reviewer_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: reviewerStatus("status").default("pending").notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    assignedBy: varchar("assigned_by", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
  },
  (table) => ({
    uniqueReviewer: uniqueIndex("unique_document_reviewer").on(table.documentId, table.reviewerId)
  })
);

export const documentReviews = createTable("document_reviews", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  documentId: varchar("document_id", { length: 255 })
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  versionId: varchar("version_id", { length: 255 })
    .notNull()
    .references(() => documentVersions.id, { onDelete: "cascade" }),
  comments: text("comments").notNull(),
  status: reviewStatus("status").default("submitted").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
});

export const documentMentions = createTable(
  "document_mentions",
  {
    messageId: varchar("message_id", { length: 255 })
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    documentId: varchar("document_id", { length: 255 })
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.documentId] })
  })
);
