import { pgEnum } from "drizzle-orm/pg-core";

export const teamRole = pgEnum("dexter_team_role", ["owner", "admin", "member"]);
export const documentStatus = pgEnum("dexter_document_status", ["draft", "published", "archived"]);
export const reviewerStatus = pgEnum("dexter_reviewer_status", ["pending", "in_progress", "completed", "declined"]);
export const reviewStatus = pgEnum("dexter_review_status", ["submitted", "accepted", "rejected"]);
export const accessLevel = pgEnum("dexter_access_level", ["read", "write", "admin"]);
export const inviteStatus = pgEnum("dexter_invite_status", ["pending", "accepted", "declined", "expired"]);
export const conversationType = pgEnum("dexter_conversation_type", ["private", "team", "ai"]);
export const resourceType = pgEnum("dexter_resource_type", ["message", "document", "conversation", "document_review"]);
export const notificationEventType = pgEnum("dexter_notification_event_type", [
  "mention",
  "review_request",
  "review_submitted",
  "review_accepted",
  "review_rejected",
  "document_share",
  "conversation_share",
  "access_granted",
  "new_message"
]);
export const fileType = pgEnum("dexter_file_type", [
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "txt",
  "md",
  "json",
  "csv",
  "image"
]);
