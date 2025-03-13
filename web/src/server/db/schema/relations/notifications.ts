import { relations } from "drizzle-orm";

import { documents } from "../tables/documents";
import { documentReviews } from "../tables/documents";
import { conversations, messages } from "../tables/messages";
import { notifications } from "../tables/notifications";
import { users } from "../tables/users";

export const notificationsRelations = relations(notifications, ({ one }) => ({
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
    relationName: "sentNotifications"
  }),
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
    relationName: "receivedNotifications"
  }),
  message: one(messages, {
    fields: [notifications.messageId],
    references: [messages.id],
    relationName: "messageNotifications"
  }),
  document: one(documents, {
    fields: [notifications.documentId],
    references: [documents.id],
    relationName: "documentNotifications"
  }),
  conversation: one(conversations, {
    fields: [notifications.conversationId],
    references: [conversations.id],
    relationName: "conversationNotifications"
  }),
  documentReview: one(documentReviews, {
    fields: [notifications.documentReviewId],
    references: [documentReviews.id],
    relationName: "documentReviewNotifications"
  })
}));
