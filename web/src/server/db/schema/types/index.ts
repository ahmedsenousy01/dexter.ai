import {
  type accounts,
  type conversationMentions,
  type conversationParticipants,
  type conversations,
  type documentAccess,
  type documentMentions,
  type documentReviewers,
  type documentReviews,
  type documentVersions,
  type documents,
  type messageMentions,
  type messages,
  type notifications,
  type teamInvites,
  type teamMembers,
  type teams,
  type users
} from "../tables";

// Insert types
export type InsertUser = typeof users.$inferInsert;
export type InsertAccount = typeof accounts.$inferInsert;
export type InsertTeam = typeof teams.$inferInsert;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export type InsertConversation = typeof conversations.$inferInsert;
export type InsertConversationParticipant = typeof conversationParticipants.$inferInsert;
export type InsertMessage = typeof messages.$inferInsert;
export type InsertMessageMention = typeof messageMentions.$inferInsert;
export type InsertConversationMention = typeof conversationMentions.$inferInsert;
export type InsertDocument = typeof documents.$inferInsert;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;
export type InsertDocumentAccess = typeof documentAccess.$inferInsert;
export type InsertDocumentMention = typeof documentMentions.$inferInsert;
export type InsertDocumentReviewer = typeof documentReviewers.$inferInsert;
export type InsertDocumentReview = typeof documentReviews.$inferInsert;
export type InsertNotification = typeof notifications.$inferInsert;
export type InsertTeamInvite = typeof teamInvites.$inferInsert;

// Select types
export type SelectUser = typeof users.$inferSelect;
export type SelectAccount = typeof accounts.$inferSelect;
export type SelectTeam = typeof teams.$inferSelect;
export type SelectTeamMember = typeof teamMembers.$inferSelect;
export type SelectConversation = typeof conversations.$inferSelect;
export type SelectConversationParticipant = typeof conversationParticipants.$inferSelect;
export type SelectMessage = typeof messages.$inferSelect;
export type SelectMessageMention = typeof messageMentions.$inferSelect;
export type SelectConversationMention = typeof conversationMentions.$inferSelect;
export type SelectDocument = typeof documents.$inferSelect;
export type SelectDocumentVersion = typeof documentVersions.$inferSelect;
export type SelectDocumentAccess = typeof documentAccess.$inferSelect;
export type SelectDocumentMention = typeof documentMentions.$inferSelect;
export type SelectDocumentReviewer = typeof documentReviewers.$inferSelect;
export type SelectDocumentReview = typeof documentReviews.$inferSelect;
export type SelectNotification = typeof notifications.$inferSelect;
export type SelectTeamInvite = typeof teamInvites.$inferSelect;

// Relation types
export type SelectUserWithRelations = typeof users.$inferSelect & {
  accounts?: (typeof accounts.$inferSelect)[] | null;
  createdTeams?: (typeof teams.$inferSelect)[] | null;
  teamMemberships?: (typeof teamMembers.$inferSelect)[] | null;
  sentInvites?: (typeof teamInvites.$inferSelect)[] | null;
  sentMessages?: (typeof messages.$inferSelect)[] | null;
  ownedDocuments?: (typeof documents.$inferSelect)[] | null;
  assignedReviews?: (typeof documentReviewers.$inferSelect)[] | null;
  assignedReviewers?: (typeof documentReviewers.$inferSelect)[] | null;
  submittedReviews?: (typeof documentReviews.$inferSelect)[] | null;
  sentNotifications?: (typeof notifications.$inferSelect)[] | null;
  receivedNotifications?: (typeof notifications.$inferSelect)[] | null;
};

export type SelectAccountWithRelations = typeof accounts.$inferSelect & {
  user?: typeof users.$inferSelect | null;
};
