import { relations } from "drizzle-orm";

import { conversations } from "../tables/messages";
import { teamInvites, teamMembers, teams } from "../tables/teams";
import { users } from "../tables/users";

export const teamsRelations = relations(teams, ({ one, many }) => ({
  creator: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
    relationName: "createdTeams"
  }),
  members: many(teamMembers),
  conversations: many(conversations),
  invites: many(teamInvites)
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id]
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id]
  })
}));

export const teamInvitesRelations = relations(teamInvites, ({ one }) => ({
  team: one(teams, {
    fields: [teamInvites.teamId],
    references: [teams.id]
  }),
  inviter: one(users, {
    fields: [teamInvites.invitedBy],
    references: [users.id],
    relationName: "sentInvites"
  })
}));
