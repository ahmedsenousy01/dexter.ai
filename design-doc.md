# Dexter.ai Design Document

## Overview

Dexter.ai is a collaborative document management and communication platform that integrates AI capabilities to enhance productivity. The platform enables users to create teams, manage documents with version control, request and submit reviews, and communicate through private and team-based conversations.

## Database Schema

The database schema is designed to support all core functionalities with proper relationships and constraints. Key tables include:

- `users`: User accounts and OAuth authentication
- `accounts`: OAuth provider accounts linked to users
- `teams`: Team management with UUID-based IDs
- `team_members`: User membership in teams with roles
- `team_invites`: Pending invitations to join teams
- `conversations`: Private and team-based communication channels
- `messages`: Text communication with support for mentions
- `documents`: Document management with versioning
- `document_versions`: Version control with semantic versioning
- `document_reviews`: Review workflow for documents
- `notifications`: System notifications for various events

Key Schema Features:

- All IDs are UUIDs stored as varchar(255)
- Foreign key constraints with ON DELETE CASCADE
- Proper indexes for performance optimization
- Check constraints for data integrity
- Enum types for status and role fields

## Use Cases and Implementation Details

### 1. User Management

#### 1.1 Registration and Authentication

**Implementation:**

- Users register via OAuth authentication
- OAuth accounts linked to users via foreign key with cascade delete
- Authentication uses Next-Auth JWT strategy

```typescript
// Registration flow with OAuth
async function handleOAuthSignIn(provider: string, profile: OAuthProfile, account: OAuthAccount): Promise<SelectUser> {
  return db.transaction(async (tx) => {
    // Create or find user
    const [user] = await tx
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: profile.email,
        name: profile.name,
        image: profile.image,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: profile.name,
          image: profile.image,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Link OAuth account
    await tx.insert(accounts).values({
      userId: user.id,
      type: "oauth",
      provider: provider,
      providerAccountId: account.providerAccountId,
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expires_at: account.expires_at,
      token_type: account.token_type,
      scope: account.scope,
      id_token: account.id_token,
      session_state: account.session_state,
    });

    return user;
  });
}
```

#### 1.2 Profile Management

**Implementation:**

- Users can update their profile information
- Account deletion cascades to all related records (teams created, messages, etc.)

```typescript
// Update user profile
async function updateUserProfile(userId: string, updates: Partial<InsertUser>): Promise<SelectUser> {
  return db
    .update(users)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
}

// Delete user account
async function deleteUserAccount(userId: string): Promise<void> {
  // With CASCADE constraints, this will remove all dependent records
  await db.delete(users).where(eq(users.id, userId));
}
```

### 2. Team Collaboration

#### 2.1 Team Creation and Management

**Implementation:**

- Teams use UUID-based IDs
- Team names must be unique per user (enforced by database index)
- Team deletion cascades to all related records

```typescript
// Create a new team
async function createTeam(name: string, createdBy: string): Promise<SelectTeam> {
  return db.transaction(async (tx) => {
    // Create team with UUID
    const [team] = await tx
      .insert(teams)
      .values({
        id: crypto.randomUUID(),
        name,
        createdBy,
      })
      .returning();

    // Add creator as owner
    await tx.insert(teamMembers).values({
      teamId: team.id,
      userId: createdBy,
      role: "owner",
    });

    return team;
  });
}
```

#### 2.2 Team Invitations

**Implementation:**

- Team owners/admins can invite users by email
- Invitations have expiration dates and unique tokens
- Users accept/decline invitations to join teams

```typescript
// Send team invitation
async function inviteUserToTeam(
  teamId: string,
  email: string,
  role: "admin" | "member",
  invitedBy: string
): Promise<SelectTeamInvite> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiration

  return db
    .insert(teamInvites)
    .values({
      teamId,
      email,
      invitedBy,
      role,
      token,
      status: "pending",
      expiresAt,
    })
    .returning();
}

// Accept team invitation
async function acceptTeamInvitation(token: string, userId: string): Promise<void> {
  const invite = await db.query.teamInvites.findFirst({
    where: and(eq(teamInvites.token, token), eq(teamInvites.status, "pending"), gt(teamInvites.expiresAt, new Date())),
  });

  if (!invite) throw new Error("Invalid or expired invitation");

  // Begin transaction
  await db.transaction(async (tx) => {
    // Add user to team
    await tx.insert(teamMembers).values({
      teamId: invite.teamId,
      userId,
      role: invite.role,
    });

    // Update invitation status
    await tx.update(teamInvites).set({ status: "accepted" }).where(eq(teamInvites.id, invite.id));
  });
}
```

#### 2.3 Role-Based Access Control

**Implementation:**

- Team members have roles: owner, admin, or member
- Permissions are enforced based on roles

```typescript
// Check if user has required role for an action
async function hasTeamPermission(
  userId: string,
  teamId: string,
  requiredRoles: Array<"owner" | "admin" | "member">
): Promise<boolean> {
  const membership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
  });

  return membership ? requiredRoles.includes(membership.role) : false;
}
```

### 3. Conversations and Messaging

#### 3.1 Conversation Types

**Implementation:**

- Private conversations between users
- Team channels for group discussions
- AI conversations with the Dexter assistant

```typescript
// Create a private conversation
async function createPrivateConversation(
  participantIds: string[],
  isAiConversation: boolean = false
): Promise<SelectConversation> {
  // Begin transaction
  return db.transaction(async (tx) => {
    // Create conversation
    const [conversation] = await tx
      .insert(conversations)
      .values({
        type: "private",
        isAiConversation,
      })
      .returning();

    // Add participants
    for (const userId of participantIds) {
      await tx.insert(conversationParticipants).values({
        conversationId: conversation.id,
        userId,
      });
    }

    return conversation;
  });
}

// Create a team channel
async function createTeamChannel(teamId: string, creatorId: string): Promise<SelectConversation> {
  // Check permissions first
  const hasPermission = await hasTeamPermission(creatorId, teamId, ["owner", "admin"]);
  if (!hasPermission) throw new Error("Insufficient permissions");

  return db
    .insert(conversations)
    .values({
      type: "team",
      teamId,
      isAiConversation: false,
    })
    .returning();
}

// Create an AI conversation
async function createAiConversation(userId: string): Promise<SelectConversation> {
  return createPrivateConversation([userId], true);
}
```

#### 3.2 Messaging with Mentions

**Implementation:**

- Users send messages in conversations
- Messages can mention users, documents, or other conversations
- Mentions trigger notifications
- Real-time message delivery through Pusher
- Messages are stored in database for persistence

```typescript
// Send a message with real-time delivery
async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  mentionedUserIds: string[] = [],
  mentionedDocumentIds: string[] = [],
  mentionedConversationIds: string[] = []
): Promise<SelectMessage> {
  // Begin transaction
  return db.transaction(async (tx) => {
    // Create message
    const [message] = await tx
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content,
        isAiResponse: false,
      })
      .returning();

    // Send real-time message through Pusher
    await pusher.trigger(`private-conversation-${conversationId}`, "new-message", {
      ...message,
      sender: await getUserBasicInfo(senderId),
    });

    // Add user mentions
    for (const userId of mentionedUserIds) {
      await tx.insert(messageMentions).values({
        messageId: message.id,
        mentionedUserId: userId,
      });

      // Create and deliver notification
      await createNotification({
        senderId,
        recipientId: userId,
        eventType: "mention",
        resourceType: "message",
        messageId: message.id,
      });
    }

    // Add document mentions with real-time updates
    for (const documentId of mentionedDocumentIds) {
      await tx.insert(documentMentions).values({
        messageId: message.id,
        documentId,
      });

      // Get document owner for notification
      const document = await tx.query.documents.findFirst({
        where: eq(documents.id, documentId),
      });

      if (document && document.ownerId !== senderId) {
        await createNotification({
          senderId,
          recipientId: document.ownerId,
          eventType: "mention",
          resourceType: "document",
          documentId,
        });
      }
    }

    // Add conversation mentions with real-time updates
    for (const mentionedConversationId of mentionedConversationIds) {
      await tx.insert(conversationMentions).values({
        messageId: message.id,
        mentionedConversationId,
      });

      // Notify participants
      const participants = await tx.query.conversationParticipants.findMany({
        where: eq(conversationParticipants.conversationId, mentionedConversationId),
      });

      for (const participant of participants) {
        if (participant.userId !== senderId) {
          await createNotification({
            senderId,
            recipientId: participant.userId,
            eventType: "mention",
            resourceType: "conversation",
            conversationId: mentionedConversationId,
          });
        }
      }
    }

    return message;
  });
}

// Client-side conversation management
class ConversationManager {
  private messages: SelectMessage[] = [];
  private pusherChannel: Channel;

  async initialize(conversationId: string) {
    // Load initial messages from database
    this.messages = await this.loadMessages(conversationId);

    // Subscribe to real-time updates
    this.pusherChannel = pusher.subscribe(`private-conversation-${conversationId}`);
    this.pusherChannel.bind("new-message", this.handleNewMessage.bind(this));
  }

  private async loadMessages(conversationId: string): Promise<SelectMessage[]> {
    return db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  private handleNewMessage(message: SelectMessage) {
    this.messages.push(message);
    this.updateUI();
    this.scrollToBottom();
  }

  private updateUI() {
    this.updateMessageList();
    this.updateTypingIndicator();
  }

  private scrollToBottom() {
    // Scroll chat to bottom when new message arrives
    const chatContainer = document.getElementById("chat-messages");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }
}

// Typing indicator management
class TypingIndicatorManager {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  async sendTypingIndicator(conversationId: string, userId: string) {
    await pusher.trigger(`private-conversation-${conversationId}`, "typing", {
      userId,
      isTyping: true,
    });

    // Clear existing timeout
    const existingTimeout = this.timeouts.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to clear typing indicator
    const timeout = setTimeout(async () => {
      await pusher.trigger(`private-conversation-${conversationId}`, "typing", {
        userId,
        isTyping: false,
      });
      this.timeouts.delete(userId);
    }, 3000);

    this.timeouts.set(userId, timeout);
  }
}
```

#### 3.3 AI-Assisted Conversations

**Implementation:**

- Users can chat with the AI assistant
- AI responses are flagged in the messages table

```typescript
// Send message to AI and get response
async function sendMessageToAI(conversationId: string, userId: string, content: string): Promise<SelectMessage> {
  // First, send the user's message
  await sendMessage(conversationId, userId, content);

  // Generate AI response (implementation depends on AI service)
  const aiResponse = await generateAIResponse(content);

  // Save AI response as a message
  return db
    .insert(messages)
    .values({
      conversationId,
      senderId: "system-ai", // Use a dedicated system user ID for AI
      content: aiResponse,
      isAiResponse: true,
      requestedBy: userId, // Track which user requested this response
    })
    .returning();
}
```

### 4. Document Management

#### 4.1 Document Creation and Versioning

**Implementation:**

- Documents use UUID-based IDs
- Version numbers follow semantic versioning (enforced by check constraint)
- Document deletion cascades to all related records

```typescript
// Create a document
async function createDocument(
  title: string,
  ownerId: string,
  initialContent: Buffer,
  isAiGenerated: boolean = false
): Promise<SelectDocument> {
  return db.transaction(async (tx) => {
    const documentId = crypto.randomUUID();
    const versionId = crypto.randomUUID();

    // Store file and get path
    const filePath = await storeDocumentFile(initialContent, documentId, "1.0.0");

    // Create initial version
    const [version] = await tx
      .insert(documentVersions)
      .values({
        id: versionId,
        documentId,
        version: "1.0.0",
        filePath,
        fileType: determineFileType(initialContent),
        fileSizeBytes: initialContent.length.toString(),
        createdBy: ownerId,
      })
      .returning();

    // Create document
    const [document] = await tx
      .insert(documents)
      .values({
        id: documentId,
        title,
        ownerId,
        currentVersionId: versionId,
        isAiGenerated,
        status: "draft",
      })
      .returning();

    // Grant owner admin access
    await tx.insert(documentAccess).values({
      documentId,
      userId: ownerId,
      accessLevel: "admin",
    });

    return document;
  });
}
```

#### 4.2 Document Access Control

**Implementation:**

- Documents have access levels: read, write, admin
- Access can be granted to users or teams
- Mentions can automatically grant read access

```typescript
// Grant document access to a user
async function grantUserDocumentAccess(
  documentId: string,
  userId: string,
  accessLevel: "read" | "write" | "admin",
  grantedBy: string
): Promise<void> {
  // Check if granter has admin access
  const granterAccess = await db.query.documentAccess.findFirst({
    where: and(
      eq(documentAccess.documentId, documentId),
      eq(documentAccess.userId, grantedBy),
      eq(documentAccess.accessLevel, "admin")
    ),
  });

  if (!granterAccess) throw new Error("Insufficient permissions to grant access");

  // Check if access already exists
  const existingAccess = await db.query.documentAccess.findFirst({
    where: and(eq(documentAccess.documentId, documentId), eq(documentAccess.userId, userId)),
  });

  if (existingAccess) {
    // Update existing access if needed
    if (existingAccess.accessLevel !== accessLevel) {
      await db.update(documentAccess).set({ accessLevel }).where(eq(documentAccess.id, existingAccess.id));
    }
  } else {
    // Create new access
    await db.insert(documentAccess).values({
      documentId,
      userId,
      accessLevel,
    });

    // Create notification
    await db.insert(notifications).values({
      senderId: grantedBy,
      recipientId: userId,
      eventType: "access_granted",
      resourceType: "document",
      documentId,
    });
  }
}

// Grant document access to a team
async function grantTeamDocumentAccess(
  documentId: string,
  teamId: string,
  accessLevel: "read" | "write" | "admin",
  grantedBy: string
): Promise<void> {
  // Similar implementation to user access, but for teams
  // ...
}

// Handle document mention in a message (auto-grant read access)
async function handleDocumentMention(messageId: string, documentId: string, senderId: string): Promise<void> {
  // Get conversation participants
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    with: {
      conversation: {
        with: {
          participants: true,
        },
      },
    },
  });

  if (!message) return;

  // Auto-grant read access to all conversation participants
  for (const participant of message.conversation.participants) {
    // Skip document owner and sender
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
    });

    if (!document || participant.userId === document.ownerId || participant.userId === senderId) {
      continue;
    }

    // Check if user already has access
    const existingAccess = await db.query.documentAccess.findFirst({
      where: and(eq(documentAccess.documentId, documentId), eq(documentAccess.userId, participant.userId)),
    });

    if (!existingAccess) {
      // Grant read access
      await db.insert(documentAccess).values({
        documentId,
        userId: participant.userId,
        accessLevel: "read",
      });

      // Create notification
      await db.insert(notifications).values({
        senderId,
        recipientId: participant.userId,
        eventType: "access_granted",
        resourceType: "document",
        documentId,
      });
    }
  }
}

// Check user's effective access level to a document
async function getEffectiveAccessLevel(
  documentId: string,
  userId: string
): Promise<"none" | "read" | "write" | "admin"> {
  // Get direct user access
  const userAccess = await db.query.documentAccess.findFirst({
    where: and(eq(documentAccess.documentId, documentId), eq(documentAccess.userId, userId)),
  });

  // Get user's teams
  const userTeams = await db.query.teamMembers.findMany({
    where: eq(teamMembers.userId, userId),
    columns: {
      teamId: true,
    },
  });

  const teamIds = userTeams.map((tm) => tm.teamId);

  // Get team access levels
  const teamAccess =
    teamIds.length > 0
      ? await db.query.documentAccess.findMany({
          where: and(eq(documentAccess.documentId, documentId), inArray(documentAccess.teamId, teamIds)),
        })
      : [];

  // Check if user is document owner
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
    columns: {
      ownerId: true,
    },
  });

  if (document?.ownerId === userId) {
    return "admin"; // Document owner always has admin access
  }

  // Determine highest access level
  const accessLevels = {
    none: 0,
    read: 1,
    write: 2,
    admin: 3,
  };

  let highestAccess = "none";

  // Check user direct access
  if (userAccess) {
    highestAccess = userAccess.accessLevel;
  }

  // Check team access and take highest
  for (const access of teamAccess) {
    if (accessLevels[access.accessLevel] > accessLevels[highestAccess as keyof typeof accessLevels]) {
      highestAccess = access.accessLevel;
    }
  }

  return highestAccess as "none" | "read" | "write" | "admin";
}
```

### 5. Document Review Workflow

#### 5.1 Review Requests

**Implementation:**

- Document owners request reviews from other users
- Reviewers receive notifications and can accept/decline

```typescript
// Request document review
async function requestDocumentReview(
  documentId: string,
  reviewerId: string,
  assignedBy: string
): Promise<SelectDocumentReviewer> {
  // Check if requester has permission
  const requesterAccess = await db.query.documentAccess.findFirst({
    where: and(
      eq(documentAccess.documentId, documentId),
      eq(documentAccess.userId, assignedBy),
      or(eq(documentAccess.accessLevel, "admin"), eq(documentAccess.accessLevel, "write"))
    ),
  });

  if (!requesterAccess) throw new Error("Insufficient permissions to request review");

  // Create review request
  const [reviewer] = await db
    .insert(documentReviewers)
    .values({
      documentId,
      reviewerId,
      assignedBy,
      status: "pending",
    })
    .returning();

  // Create notification
  await db.insert(notifications).values({
    senderId: assignedBy,
    recipientId: reviewerId,
    eventType: "review_request",
    resourceType: "document",
    documentId,
  });

  // Grant read access if not already granted
  const existingAccess = await db.query.documentAccess.findFirst({
    where: and(eq(documentAccess.documentId, documentId), eq(documentAccess.userId, reviewerId)),
  });

  if (!existingAccess) {
    await db.insert(documentAccess).values({
      documentId,
      userId: reviewerId,
      accessLevel: "read",
    });
  }

  return reviewer;
}

// Accept/decline review request
async function updateReviewStatus(
  reviewId: string,
  reviewerId: string,
  status: "pending" | "in_progress" | "completed" | "declined"
): Promise<SelectDocumentReviewer> {
  const reviewer = await db.query.documentReviewers.findFirst({
    where: and(eq(documentReviewers.id, reviewId), eq(documentReviewers.reviewerId, reviewerId)),
    with: {
      document: true,
    },
  });

  if (!reviewer) throw new Error("Review request not found");

  // Update status
  const [updatedReviewer] = await db
    .update(documentReviewers)
    .set({ status })
    .where(eq(documentReviewers.id, reviewId))
    .returning();

  // Create notification for document owner
  await db.insert(notifications).values({
    senderId: reviewerId,
    recipientId: reviewer.document.ownerId,
    eventType: status === "declined" ? "review_declined" : "review_status_updated",
    resourceType: "document",
    documentId: reviewer.documentId,
  });

  return updatedReviewer;
}
```

#### 5.2 Review Submission

**Implementation:**

- Reviewers submit feedback with comments
- Reviews reference specific document versions
- Document owners receive notifications

```typescript
// Submit document review
async function submitDocumentReview(
  documentId: string,
  reviewerId: string,
  versionId: string,
  comments: string
): Promise<SelectDocumentReview> {
  // Check if reviewer is assigned
  const reviewerRecord = await db.query.documentReviewers.findFirst({
    where: and(eq(documentReviewers.documentId, documentId), eq(documentReviewers.reviewerId, reviewerId)),
  });

  if (!reviewerRecord) throw new Error("Not assigned as reviewer");

  // Begin transaction
  return db.transaction(async (tx) => {
    // Create review
    const [review] = await tx
      .insert(documentReviews)
      .values({
        documentId,
        reviewerId,
        versionId,
        comments,
        status: "submitted",
      })
      .returning();

    // Update reviewer status
    await tx.update(documentReviewers).set({ status: "completed" }).where(eq(documentReviewers.id, reviewerRecord.id));

    // Get document owner
    const document = await tx.query.documents.findFirst({
      where: eq(documents.id, documentId),
    });

    if (document) {
      // Create notification for document owner
      await tx.insert(notifications).values({
        senderId: reviewerId,
        recipientId: document.ownerId,
        eventType: "review_submitted",
        resourceType: "document_review",
        documentReviewId: review.id,
      });
    }

    return review;
  });
}

// Accept/reject review
async function processReview(
  reviewId: string,
  ownerId: string,
  status: "accepted" | "rejected"
): Promise<SelectDocumentReview> {
  const review = await db.query.documentReviews.findFirst({
    where: eq(documentReviews.id, reviewId),
    with: {
      document: true,
    },
  });

  if (!review) throw new Error("Review not found");

  // Verify owner
  if (review.document.ownerId !== ownerId) {
    throw new Error("Only the document owner can process reviews");
  }

  // Update review status
  const [updatedReview] = await db
    .update(documentReviews)
    .set({ status })
    .where(eq(documentReviews.id, reviewId))
    .returning();

  // Create notification for reviewer
  await db.insert(notifications).values({
    senderId: ownerId,
    recipientId: review.reviewerId,
    eventType: status === "accepted" ? "review_accepted" : "review_rejected",
    resourceType: "document_review",
    documentReviewId: reviewId,
  });

  return updatedReview;
}
```

### 6. Notifications

#### 6.1 Notification System

**Implementation:**

- Notifications use UUID-based IDs
- Resource references use foreign keys with cascade delete
- Check constraints ensure proper resource type and ID combinations
- Real-time delivery through Pusher
- Persistent storage in database for history and state

```typescript
// Initialize Pusher client
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Create notification with real-time delivery
async function createNotification(
  senderId: string,
  recipientId: string,
  eventType: NotificationEventType,
  resource: {
    type: ResourceType;
    messageId?: string;
    documentId?: string;
    conversationId?: string;
    documentReviewId?: string;
  }
): Promise<SelectNotification> {
  // Create notification in database
  const [notification] = await db
    .insert(notifications)
    .values({
      id: crypto.randomUUID(),
      senderId,
      recipientId,
      eventType,
      resourceType: resource.type,
      messageId: resource.messageId,
      documentId: resource.documentId,
      conversationId: resource.conversationId,
      documentReviewId: resource.documentReviewId,
      isRead: false,
    })
    .returning();

  // Send real-time notification through Pusher
  await pusher.trigger(`private-notifications-${recipientId}`, "new-notification", {
    ...notification,
    sender: await getUserBasicInfo(senderId),
  });

  return notification;
}

// Client-side notification management
class NotificationManager {
  private notifications: SelectNotification[] = [];
  private pusherChannel: Channel;

  async initialize(userId: string) {
    // Load initial notifications from database
    this.notifications = await this.loadNotifications();

    // Subscribe to real-time updates
    this.pusherChannel = pusher.subscribe(`private-notifications-${userId}`);
    this.pusherChannel.bind("new-notification", this.handleNewNotification.bind(this));
  }

  private async loadNotifications(): Promise<SelectNotification[]> {
    return db.query.notifications.findMany({
      where: eq(notifications.recipientId, this.currentUserId),
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  private handleNewNotification(notification: SelectNotification) {
    this.notifications.unshift(notification);
    this.updateUI();
    this.showToast(notification);
  }

  private updateUI() {
    this.updateNotificationList();
    this.updateUnreadBadge();
  }

  private showToast(notification: SelectNotification) {
    // Show toast notification based on event type
    const message = this.formatNotificationMessage(notification);
    toast.info(message, {
      position: "top-right",
      autoClose: 5000,
    });
  }

  private formatNotificationMessage(notification: SelectNotification): string {
    switch (notification.eventType) {
      case "mention":
        return `${notification.sender.name} mentioned you in a message`;
      case "review_request":
        return `${notification.sender.name} requested your review on a document`;
      case "review_submitted":
        return `${notification.sender.name} submitted a review`;
      // ... handle other notification types
    }
  }
}

// Message notification service with real-time updates
class MessageNotificationService {
  async notifyTeamParticipants(message: InsertMessage): Promise<void> {
    const conversation = await this.getConversation(message.conversationId);
    if (conversation.type !== "team") return;

    const participants = await this.getConversationParticipants(message.conversationId);

    // Notify all participants except sender
    for (const participant of participants) {
      if (participant.userId === message.senderId) continue;

      // Create notification in database and send real-time update
      await createNotification({
        senderId: message.senderId,
        recipientId: participant.userId,
        eventType: "new_message",
        resourceType: "message",
        messageId: message.id,
        conversationId: message.conversationId,
      });
    }
  }
}
```

#### 6.2 Document Access Management

**Implementation:**

- Access control is handled by application logic
- Document mentions automatically grant access to all conversation participants
- Access is recorded in the database for audit and permission checks

```typescript
// Message processor service
class MessageProcessorService {
  async processMessage(message: InsertMessage): Promise<void> {
    const mentions = await this.extractMentions(message.content);

    // Process document mentions
    for (const documentId of mentions.documents) {
      await this.handleDocumentMention(message, documentId);
    }

    // Notify team conversation participants
    await this.notifyTeamParticipants(message);
  }

  private async handleDocumentMention(message: InsertMessage, documentId: string): Promise<void> {
    const document = await this.getDocument(documentId);
    if (!document) return;

    // Get conversation participants
    const participants = await this.getConversationParticipants(message.conversationId);

    // Grant access to all participants
    for (const participant of participants) {
      await this.grantParticipantAccess(participant, document, message.senderId);
    }
  }

  private async grantParticipantAccess(
    participant: SelectConversationParticipant,
    document: SelectDocument,
    mentionedBy: string
  ): Promise<void> {
    // Skip if participant is document owner
    if (participant.userId === document.ownerId) return;

    // Check existing access
    const existingAccess = await this.getExistingAccess(document.id, participant.userId);
    if (existingAccess) return;

    // Grant read access
    await db.transaction(async (tx) => {
      // Create access record
      await tx.insert(documentAccess).values({
        documentId: document.id,
        userId: participant.userId,
        accessLevel: "read",
      });

      // Send notification
      await sendNotification({
        senderId: mentionedBy,
        recipientId: participant.userId,
        eventType: "access_granted",
        resourceType: "document",
        documentId: document.id,
      });
    });
  }
}

// Document access service
class DocumentAccessService {
  async checkAccess(
    documentId: string,
    userId: string,
    requiredLevel: "read" | "write" | "admin" = "read"
  ): Promise<boolean> {
    const access = await db.query.documentAccess.findFirst({
      where: and(eq(documentAccess.documentId, documentId), eq(documentAccess.userId, userId)),
    });

    if (!access) return false;

    const accessLevels = {
      read: 0,
      write: 1,
      admin: 2,
    };

    return accessLevels[access.accessLevel] >= accessLevels[requiredLevel];
  }

  async upgradeAccess(
    documentId: string,
    userId: string,
    newLevel: "write" | "admin",
    grantedBy: string
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Update access level
      await tx
        .update(documentAccess)
        .set({ accessLevel: newLevel })
        .where(and(eq(documentAccess.documentId, documentId), eq(documentAccess.userId, userId)));

      // Send notification
      await sendNotification({
        senderId: grantedBy,
        recipientId: userId,
        eventType: "access_upgraded",
        resourceType: "document",
        documentId,
      });
    });
  }
}
```

## Application Logic Requirements

Some functionality requires application-level logic that isn't enforced by the database schema:

1. **Role-Based Permissions**: The application must check team roles before allowing certain operations.

2. **Mention Processing**: When users mention documents/users, the application needs to parse the message content and create the appropriate mention records.

3. **AI Integration**: The application needs to integrate with an AI service for document generation and conversation responses.

4. **Version Control**: The application needs to handle semantic versioning and file storage for document versions.

5. **Automatic Access Grants**: When documents are mentioned, the application should automatically grant read access to conversation participants.

## Security Considerations

1. **Authentication**: Secure password hashing and token-based authentication.

2. **Authorization**: Role-based access control for teams and documents.

3. **Data Validation**: Input validation to prevent injection attacks.

4. **Rate Limiting**: Prevent abuse of AI generation features.

5. **Audit Logging**: Track sensitive operations for security monitoring.

## Future Enhancements

1. **User Profiles**: Add more user profile fields (name, avatar, etc.).

2. **Rich Text Editing**: Support for rich text in documents and messages.

3. **File Attachments**: Allow file attachments in messages.

4. **Advanced Search**: Full-text search across documents and messages.

5. **Integration APIs**: APIs for integrating with other tools and services.

6. **Mobile Applications**: Native mobile apps for iOS and Android.
