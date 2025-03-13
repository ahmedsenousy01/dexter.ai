import { relations } from "drizzle-orm";

import {
  documentAccess,
  documentMentions,
  documentReviewers,
  documentReviews,
  documentVersions,
  documents
} from "../tables/documents";
import { messages } from "../tables/messages";
import { teams } from "../tables/teams";
import { users } from "../tables/users";

export const documentsRelations = relations(documents, ({ one, many }) => ({
  owner: one(users, {
    fields: [documents.ownerId],
    references: [users.id],
    relationName: "ownedDocuments"
  }),
  currentVersion: one(documentVersions, {
    fields: [documents.currentVersionId],
    references: [documentVersions.id]
  }),
  versions: many(documentVersions),
  access: many(documentAccess),
  mentions: many(documentMentions),
  reviewers: many(documentReviewers),
  reviews: many(documentReviews)
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id]
  }),
  creator: one(users, {
    fields: [documentVersions.createdBy],
    references: [users.id]
  })
}));

export const documentAccessRelations = relations(documentAccess, ({ one }) => ({
  document: one(documents, {
    fields: [documentAccess.documentId],
    references: [documents.id]
  }),
  user: one(users, {
    fields: [documentAccess.userId],
    references: [users.id]
  }),
  team: one(teams, {
    fields: [documentAccess.teamId],
    references: [teams.id]
  })
}));

export const documentReviewersRelations = relations(documentReviewers, ({ one }) => ({
  document: one(documents, {
    fields: [documentReviewers.documentId],
    references: [documents.id]
  }),
  reviewer: one(users, {
    fields: [documentReviewers.reviewerId],
    references: [users.id],
    relationName: "assignedReviews"
  }),
  assigner: one(users, {
    fields: [documentReviewers.assignedBy],
    references: [users.id],
    relationName: "assignedReviewers"
  })
}));

export const documentReviewsRelations = relations(documentReviews, ({ one }) => ({
  document: one(documents, {
    fields: [documentReviews.documentId],
    references: [documents.id]
  }),
  reviewer: one(users, {
    fields: [documentReviews.reviewerId],
    references: [users.id],
    relationName: "submittedReviews"
  }),
  version: one(documentVersions, {
    fields: [documentReviews.versionId],
    references: [documentVersions.id],
    relationName: "reviewVersion"
  })
}));

export const documentMentionsRelations = relations(documentMentions, ({ one }) => ({
  message: one(messages, {
    fields: [documentMentions.messageId],
    references: [messages.id]
  }),
  document: one(documents, {
    fields: [documentMentions.documentId],
    references: [documents.id]
  })
}));
