import { relations } from "drizzle-orm";

import { documents } from "../tables/documents";
import { documentAccess, documentReviewers, documentReviews } from "../tables/documents";
import { conversationParticipants, messageMentions, messages } from "../tables/messages";
import { notifications } from "../tables/notifications";
import { teams } from "../tables/teams";
import { teamInvites, teamMembers } from "../tables/teams";
import { accounts, users } from "../tables/users";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  createdTeams: many(teams, { relationName: "createdTeams" }),
  teamMemberships: many(teamMembers),
  teamInvites: many(teamInvites),
  sentMessages: many(messages),
  ownedDocuments: many(documents, { relationName: "ownedDocuments" }),
  documentAccess: many(documentAccess),
  assignedReviews: many(documentReviewers, { relationName: "assignedReviews" }),
  assignedReviewers: many(documentReviewers, { relationName: "assignedReviewers" }),
  submittedReviews: many(documentReviews, { relationName: "submittedReviews" }),
  conversationParticipations: many(conversationParticipants),
  messageMentions: many(messageMentions),
  sentNotifications: many(notifications, { relationName: "sentNotifications" }),
  receivedNotifications: many(notifications, { relationName: "receivedNotifications" })
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] })
}));
