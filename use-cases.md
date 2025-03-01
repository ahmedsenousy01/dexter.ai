### Dexter.ai Detailed Use Case Documentation

---

#### **1. User Management**

**1.1 User Registration**

- **Description:** New users create accounts with OAuth authentication.
- **Primary Actor:** Guest User
- **Preconditions:** Email not already registered.
- **Basic Flow:**
  1. User authenticates via OAuth provider.
  2. System creates user record with UUID.
  3. System creates OAuth account record.
- **Application Logic Rules:**
  - Email uniqueness enforced by database constraint.
  - OAuth accounts linked to user via foreign key with cascade delete.
- **Error Handling:**
  - Duplicate email → "Email already registered."
  - Invalid OAuth token → "Authentication failed."

---

#### **2. Team Management**

**2.1 Team Creation**

- **Description:** Users create teams, and the creator automatically becomes the team owner.
- **Primary Actor:** Authenticated User
- **Preconditions:** User is logged in.
- **Basic Flow:**
  1. User provides a team name.
  2. System generates UUID and creates a `teams` record, setting `createdBy` to the user's ID.
  3. System creates a `team_members` record, linking the user to the team with the `owner` role.
- **Application Logic Rules:**
  - Team name must be unique per user (enforced by database unique index).
  - Maximum 10 teams per user.
  - All IDs are UUIDs stored as varchar(255).
  - Team deletion cascades to all related records.

**2.2 Invite Team Members**

- **Description:** Owners/admins invite users to join teams via email.
- **Primary Actor:** Team Owner/Admin
- **Preconditions:** Inviter has `admin`/`owner` role in the team.
- **Basic Flow:**
  1. Inviter provides the invitee's email address and role (`member` or `admin`).
  2. System creates a `team_invites` record with status `pending`, a unique token, and an expiration date.
  3. An invitation email is sent to the invitee with the token link.
  4. When invitee accepts, system creates a `team_members` record and updates the invitation status to `accepted`.
- **Application Logic Rules:**
  - Invitations expire after 7 days.
  - Existing members cannot be re-invited.
  - Invitees must have an account or create one to accept the invitation.
- **Notifications:**
  - Invitee receives email: "You've been invited to join [Team Name]."

**2.3 Promote Team Member**

- **Description:** Owners/admins promote a team member to a different role (e.g., from `member` to `admin`).
- **Primary Actor:** Team Owner/Admin
- **Preconditions:**
  - Promoter has `admin`/`owner` role.
  - Target user is a team `member`.
- **Basic Flow:**
  1. Promoter selects the member and the new role.
  2. System updates the `role` field in the corresponding `team_members` record.
- **Application Logic Rules:**
  - Owners cannot be demoted except by other owners.
  - Role changes are logged for auditing.

---

#### **3. Document Workflow**

**3.1 Document Upload/Generation**

- **Description:** Users upload files or generate documents using the AI.
- **Primary Actor:** Authenticated User
- **Basic Flow:**
  1. User uploads a file or requests AI document generation.
  2. System generates UUID and creates a `documents` record.
  3. System creates a `document_versions` record with version "1.0.0" to store the initial version.
  4. System sets the `currentVersionId` in the `documents` record to point to the initial version.
  5. System creates a `document_access` record, granting the user `admin` access to the document.
- **Application Logic Rules:**
  - For AI-generated documents, the `isAiGenerated` flag in the `documents` table is set to `true`.
  - File size limit: 50MB (enforced by application logic).
  - Document versions follow semantic versioning (major.minor.patch) enforced by database check constraint.
  - All IDs are UUIDs stored as varchar(255).
  - Document deletion cascades to all related records.

**3.2 Request Document Review**

- **Description:** Document owners/admins request reviews from other users.
- **Primary Actor:** Document Owner/Admin
- **Preconditions:**
  - Requester has `admin` access to the document (via `document_access`).
  - Reviewer exists in the system.
- **Basic Flow:**
  1. Owner selects the reviewer and the document.
  2. System creates a `document_reviewers` record, setting the `status` to `pending` and linking the document and reviewer.
  3. System grants the reviewer `read` access to the document via `document_access` (if they don't already have it).
- **Application Logic Rules:**
  - Reviewers automatically receive `read` access.
  - Users cannot review their own documents.

**3.3 Submit Document Review**

- **Description:** Reviewers provide feedback and potentially upload a revised version.
- **Primary Actor:** Reviewer
- **Preconditions:**
  - Reviewer has a `document_reviewers` record with `status` of `pending` or `in_progress`.
- **Basic Flow:**
  1. Reviewer submits comments and/or uploads a new document version.
  2. If a new version is uploaded, a new `document_versions` record is created.
  3. System creates a `document_reviews` record, linking the reviewer, document, comments, and version (if applicable). The `status` is set to `submitted`.
- **Application Logic Rules:**
  - Reviewers can upload new versions only if they have been granted `write` access via `document_access`.
  - Submissions are locked after 30 days of inactivity (application logic).

**3.4 Update Document Status**

- **Description:** Document owners change the status of a document (e.g., from `draft` to `published`).
- **Primary Actor:** Document Owner/Admin
- **Preconditions:** Requester has `admin` access to the document.
- **Basic Flow:**
  1. Owner selects the new status.
  2. System updates the `status` field in the `documents` record.
- **Application Logic Rules:**
  - Only certain status transitions may be allowed (e.g., `draft` -> `published`, but not directly `draft` -> `archived`).

---

#### **4. Notifications & Mentions**

**4.1 User Mention in Message**

- **Description:** Users mention other users in messages using `@username`.
- **Primary Actor:** Message Sender
- **Basic Flow:**
  1. User types `@username` in a message.
  2. System parses the message content and identifies the mentioned user.
  3. System creates a `message_mentions` record with UUIDs.
  4. System creates a `notifications` record with:
     - `id`: Generated UUID
     - `event_type`: `mention`
     - `resource_type`: `message`
     - `message_id`: UUID of the message
     - `sender_id`: UUID of the message sender
     - `recipient_id`: UUID of the mentioned user
- **Application Logic Rules:**
  - Mentioned users receive `read` access to the conversation (if they don't already have it).
  - Invalid mentions (non-existent users) are ignored.
  - All IDs are UUIDs stored as varchar(255).
  - Notification deletion cascades when referenced resources are deleted.

**4.2 Document Mention in Message**

- **Description:** Users reference documents in messages using `#document-title`.
- **Primary Actor:** Message Sender
- **Basic Flow:**
  1. User types `#document-title` in a message.
  2. System parses the message and identifies the referenced document.
  3. System creates a `document_mentions` record.
  4. System creates a `notifications` record with:
     - `event_type`: `mention` (or potentially a different type like `document_share`)
     - `resource_type`: `document`
     - `document_id`: ID of the document
     - `message_id`: ID of the message
     - `sender_id`: ID of the message sender
     - `recipient_id`: IDs of all conversation participants (or a specific user if it's a direct mention)
- **Application Logic Rules:**
  - All conversation participants gain `read` access to the document (if they don't already have it).
  - Access is revoked if the document is unmentioned in later messages (application logic to handle this).

**4.3 Other Notifications**

- **Description:** The system generates notifications for various events.
- **Notifications are created for the following events (matching `notificationEventType` in the schema):**
  - `review_request`: When a user is requested to review a document.
    - `resource_type`: `document_review`
    - `document_review_id`: The ID of the `document_reviewers` record.
  - `review_submitted`: When a reviewer submits their review.
    - `resource_type`: `document_review`
    - `document_review_id`: The ID of the `document_reviews` record.
  - `review_accepted`: When a review is accepted (if applicable).
    - `resource_type`: `document_review`
    - `document_review_id`: The ID of the `document_reviews` record.
  - `review_rejected`: When a review is rejected (if applicable).
    - `resource_type`: `document_review`
    - `document_review_id`: The ID of the `document_reviews` record.
  - `document_share`: When a document is explicitly shared with a user/team.
    - `resource_type`: `document`
    - `document_id`: The ID of the shared document.
  - `conversation_share`: When a conversation is shared.
    - `resource_type`: `conversation`
    - `conversation_id`: The ID of the shared conversation.
  - `access_granted`: When a user/team is granted access to a document.
    - `resource_type`: `document`
    - `document_id`: The ID of the document.
  - `new_message`: When a new message is sent in a team conversation.
    - `resource_type`: `message`
    - `message_id`: The ID of the message.
    - `conversation_id`: The ID of the conversation.

---

#### **5. Access Control**

**5.1 Document Access Grant**

- **Description:** Document owners grant access to individual users or entire teams.
- **Primary Actor:** Document Owner/Admin
- **Basic Flow:**
  1. Owner selects a user or team and an access level (`read`, `write`, or `admin`).
  2. System creates a `document_access` record with UUIDs. If a record already exists for the user/team and document, the `access_level` is updated.
- **Application Logic Rules:**
  - `admin` access allows granting access up to their own level.
  - Team access overrides individual access (if a user has individual `read` access and is part of a team with `write` access, they get `write` access).
  - Inherited Access: Users who are members of a team inherit the team's access level to a document.
  - All IDs are UUIDs stored as varchar(255).
  - Access records are deleted via cascade when users/teams are deleted.

**5.2 Access Revocation**

- **Description:** Owners revoke document access from users or teams.
- **Primary Actor:** Document Owner/Admin
- **Basic Flow:**
  1. Owner selects the user or team to revoke access from.
  2. System deletes the corresponding `document_access` record.
- **Application Logic Rules:**
  - Owners cannot revoke their own access.
  - Revoking team access removes all members' inherited access to the document.

---

#### **6. AI Integration**

**6.1 AI Document Generation**

- **Description:** Users request AI-generated documents.
- **Primary Actor:** Authenticated User
- **Basic Flow:**
  1. User provides a topic/parameters for the document.
  2. System sends the request to the AI service.
  3. AI generates the content.
  4. System creates a `documents` record with `isAiGenerated` set to `true`.
  5. System creates a `document_versions` record with version "1.0.0" and the generated content.
  6. System sets the `currentVersionId` in the `documents` record to point to the created version.
  7. System creates a `document_access` record, granting the user `admin` access.
- **Application Logic Rules:**
  - Rate limit: 10 requests/hour/user (application logic).
  - AI-generated content is watermarked in metadata (application logic).

---

### Critical Application Logic Rules

| Feature         | Rule                                           | Enforcement Mechanism             |
| --------------- | ---------------------------------------------- | --------------------------------- |
| Team Roles      | Only owners can delete teams                   | Pre-action authorization check    |
| Document Access | Mentioned users get `read` access              | Background job after message save |
| Reviews         | Reviewers cannot modify submitted reviews      | DB timestamp locking              |
| AI Content      | AI-generated docs cannot be deleted for 7 days | Scheduled cleanup job             |

### Security Considerations

- **Data Isolation:** Users can only see teams/documents they're explicitly added to.
- **Audit Trails:** All role changes and access grants logged.
- **Encryption:** Document files encrypted at rest with AES-256.

### Error Conditions & Recovery

| Scenario                                                         | Handling                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Duplicate team name                                              | Auto-append (e.g., "Team (2)")                                                       |
| Expired document review                                          | Auto-close after 30 days                                                             |
| AI service failure                                               | Retry 3x, then notify user                                                           |
| User attempts to access a document without permission            | Return a 403 Forbidden error                                                         |
| User attempts to modify a document with insufficient permissions | Return a 403 Forbidden error                                                         |
| Database operation fails                                         | Log the error, potentially retry, and return a 500 Internal Server Error to the user |
| User attempts to delete a team they don't own                    | Return a 403 Forbidden error                                                         |

This documentation ensures all use cases align with the schema while explicitly defining application-layer constraints. Let me know if you need further refinements!
