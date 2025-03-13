import { relations } from "drizzle-orm";

import { documentMentions } from "../tables/documents";
import {
  conversationMentions,
  conversationParticipants,
  conversations,
  messageMentions,
  messages
} from "../tables/messages";
import { teams } from "../tables/teams";
import { users } from "../tables/users";

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  team: one(teams, {
    fields: [conversations.teamId],
    references: [teams.id]
  }),
  participants: many(conversationParticipants),
  messages: many(messages),
  mentionedIn: many(conversationMentions, { relationName: "mentionedConversation" })
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id]
  }),
  user: one(users, {
    fields: [conversationParticipants.userId],
    references: [users.id]
  })
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id]
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages"
  }),
  userMentions: many(messageMentions),
  documentMentions: many(documentMentions),
  conversationMentions: many(conversationMentions)
}));

export const messageMentionsRelations = relations(messageMentions, ({ one }) => ({
  message: one(messages, {
    fields: [messageMentions.messageId],
    references: [messages.id]
  }),
  mentionedUser: one(users, {
    fields: [messageMentions.mentionedUserId],
    references: [users.id]
  })
}));

export const conversationMentionsRelations = relations(conversationMentions, ({ one }) => ({
  message: one(messages, {
    fields: [conversationMentions.messageId],
    references: [messages.id]
  }),
  mentionedConversation: one(conversations, {
    fields: [conversationMentions.mentionedConversationId],
    references: [conversations.id],
    relationName: "mentionedConversation"
  })
}));
