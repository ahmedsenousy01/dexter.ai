# Dexter.ai Sequence Diagrams

This document contains detailed sequence diagrams for the key use cases of Dexter.ai.

## Sequence Diagrams for Dexter.ai

### 1. User Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Next.js Frontend
    participant Auth as Next-Auth
    participant Server as tRPC Server
    participant DB as Vercel Postgres
    participant OAuth as OAuth Provider

    User->>Frontend: Click "Sign in with OAuth"
    Frontend->>Auth: Redirect to OAuth provider
    Auth->>OAuth: Request authentication
    OAuth->>User: Present login screen
    User->>OAuth: Enter credentials
    OAuth->>Auth: Return OAuth token
    Auth->>Server: Validate token
    Server->>DB: Check if user exists
    alt User exists
        DB->>Server: Return user data
        Server->>DB: Update user info if needed
    else New user
        Server->>DB: Create new user record
        Server->>DB: Create OAuth account record
    end
    Server->>Auth: Return user session data
    Auth->>Frontend: Set session cookie
    Frontend->>User: Redirect to dashboard
```

### 2. Team Creation and Management

```mermaid
sequenceDiagram
    actor Owner
    participant Frontend as Next.js Frontend
    participant Server as tRPC Server
    participant DB as Vercel Postgres
    participant Notifier as Notification Service
    participant Email as Email Service

    %% Team Creation
    Owner->>Frontend: Fill team creation form
    Frontend->>Server: createTeam(name)
    Server->>DB: Begin transaction
    Server->>DB: Insert team record with UUID
    Server->>DB: Add owner as team member with "owner" role
    DB->>Server: Return team data
    Server->>Frontend: Return success response
    Frontend->>Owner: Display team dashboard

    %% Team Invitation
    Owner->>Frontend: Enter email and role for invitation
    Frontend->>Server: inviteUserToTeam(teamId, email, role)
    Server->>DB: Check if user has permission
    DB->>Server: Return permission status
    alt Has permission
        Server->>DB: Create invitation record with token
        Server->>Email: Send invitation email
        Email->>DB: Mark email as sent
        Server->>Frontend: Return success
        Frontend->>Owner: Show "Invitation sent" message
    else No permission
        Server->>Frontend: Return error
        Frontend->>Owner: Show "Permission denied" message
    end

    %% Accept Invitation
    actor Invitee
    Invitee->>Email: Click invitation link
    Email->>Frontend: Redirect to invitation page
    Frontend->>Server: acceptTeamInvitation(token)
    Server->>DB: Verify token validity
    alt Valid token
        Server->>DB: Begin transaction
        Server->>DB: Add user to team with specified role
        Server->>DB: Update invitation status to "accepted"
        Server->>Notifier: Create notification for team owner
        DB->>Server: Return success
        Server->>Frontend: Return team data
        Frontend->>Invitee: Show "Welcome to team" message
    else Invalid token
        Server->>Frontend: Return error
        Frontend->>Invitee: Show "Invalid invitation" message
    end
```

### 3. Document Upload and Version Control

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Next.js Frontend
    participant Upload as UploadThing
    participant Server as tRPC Server
    participant DB as Vercel Postgres
    participant Storage as File Storage

    User->>Frontend: Select file and click upload
    Frontend->>Upload: Send file with metadata
    Upload->>Storage: Store file
    Storage->>Upload: Return file URL
    Upload->>Server: File uploaded callback
    Server->>DB: Begin transaction
    Server->>DB: Create document record with UUID
    Server->>DB: Create document_version record (v1.0.0)
    Server->>DB: Set currentVersionId in document
    Server->>DB: Grant user admin access to document
    DB->>Server: Return document data
    Server->>Frontend: Return document details
    Frontend->>User: Show document details page

    %% New Version Upload
    User->>Frontend: Upload new version
    Frontend->>Upload: Send file with document ID
    Upload->>Storage: Store file
    Storage->>Upload: Return file URL
    Upload->>Server: File uploaded callback
    Server->>DB: Get current version
    DB->>Server: Return version info
    Server->>Server: Calculate new version number
    Server->>DB: Begin transaction
    Server->>DB: Create new document_version record
    Server->>DB: Update document.currentVersionId
    DB->>Server: Return updated document
    Server->>Frontend: Return success
    Frontend->>User: Show updated version info
```

### 4. Document Review Workflow

```mermaid
sequenceDiagram
    actor Owner
    actor Reviewer
    participant Frontend as Next.js Frontend
    participant Server as tRPC Server
    participant DB as Vercel Postgres
    participant Notifier as Notification Service
    participant Email as Email Service

    %% Request Review
    Owner->>Frontend: Select document and reviewer
    Frontend->>Server: requestDocumentReview(documentId, reviewerId)
    Server->>DB: Check if owner has permission
    DB->>Server: Return permission status
    alt Has permission
        Server->>DB: Create document_reviewers record
        Server->>DB: Grant reviewer read access if needed
        Server->>Notifier: Create notification for reviewer
        Notifier->>Email: Send review request email
        Server->>Frontend: Return success
        Frontend->>Owner: Show "Review requested" message
    else No permission
        Server->>Frontend: Return error
        Frontend->>Owner: Show "Permission denied" message
    end

    %% Accept Review
    Reviewer->>Frontend: View notifications
    Frontend->>Server: getReviewRequests()
    Server->>DB: Query pending reviews
    DB->>Server: Return review requests
    Server->>Frontend: Display review requests
    Reviewer->>Frontend: Click "Accept review"
    Frontend->>Server: updateReviewStatus(reviewId, "in_progress")
    Server->>DB: Update reviewer status
    Server->>Notifier: Notify document owner
    Server->>Frontend: Return success
    Frontend->>Reviewer: Show document for review

    %% Submit Review
    Reviewer->>Frontend: Write review comments
    Frontend->>Server: submitDocumentReview(documentId, comments)
    Server->>DB: Begin transaction
    Server->>DB: Create document_reviews record
    Server->>DB: Update reviewer status to "completed"
    Server->>Notifier: Notify document owner
    DB->>Server: Return success
    Server->>Frontend: Return success
    Frontend->>Reviewer: Show "Review submitted" message

    %% Process Review
    Owner->>Frontend: View document reviews
    Frontend->>Server: getDocumentReviews(documentId)
    Server->>DB: Query reviews for document
    DB->>Server: Return reviews
    Server->>Frontend: Display reviews
    Owner->>Frontend: Click "Accept review"
    Frontend->>Server: processReview(reviewId, "accepted")
    Server->>DB: Update review status
    Server->>Notifier: Notify reviewer
    Server->>Frontend: Return success
    Frontend->>Owner: Show "Review accepted" message
```

### 5. Messaging and @Mentions

```mermaid
sequenceDiagram
    actor Sender
    actor Recipient
    participant Frontend as Next.js Frontend
    participant Server as tRPC Server
    participant DB as Vercel Postgres
    participant Pusher as Pusher Service
    participant Notifier as Notification Service

    %% Send Message with Mentions
    Sender->>Frontend: Type message with @username
    Frontend->>Frontend: Parse message for mentions
    Sender->>Frontend: Click "Send"
    Frontend->>Server: sendMessage(conversationId, content, mentions)
    Server->>DB: Begin transaction
    Server->>DB: Create message record

    alt Contains user mentions
        Server->>DB: Create message_mentions records
        Server->>Notifier: Create notifications for mentioned users
    end

    alt Contains document mentions
        Server->>DB: Create document_mentions records
        Server->>DB: Grant read access to conversation participants
        Server->>Notifier: Create notifications for document owner
    end

    DB->>Server: Return message data
    Server->>Pusher: Trigger new-message event
    Server->>Frontend: Return success
    Frontend->>Sender: Show message in conversation

    %% Real-time delivery to recipient
    Pusher->>Frontend: Deliver message to recipient
    Frontend->>Recipient: Display new message

    %% Notification for mention
    Notifier->>Pusher: Trigger notification event
    Pusher->>Frontend: Deliver notification
    Frontend->>Recipient: Show notification badge
    Recipient->>Frontend: Click notification
    Frontend->>Server: markNotificationAsRead(notificationId)
    Server->>DB: Update notification.isRead
    Frontend->>Recipient: Navigate to conversation
```

### 6. AI Document Generation

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Next.js Frontend
    participant Server as tRPC Server
    participant DB as Vercel Postgres
    participant AI as LangGraph AI Agent
    participant Storage as File Storage

    User->>Frontend: Fill AI document generation form
    Frontend->>Server: generateAIDocument(topic, parameters)
    Server->>AI: Request document generation
    AI->>AI: Generate document content
    AI->>Storage: Store generated content
    Storage->>AI: Return file URL
    AI->>Server: Return generated document data
    Server->>DB: Begin transaction
    Server->>DB: Create document record with isAiGenerated=true
    Server->>DB: Create document_version record (v1.0.0)
    Server->>DB: Set currentVersionId in document
    Server->>DB: Grant user admin access
    DB->>Server: Return document data
    Server->>Frontend: Return document details
    Frontend->>User: Show AI-generated document
```

### 7. AI-Assisted Conversations

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Next.js Frontend
    participant Server as tRPC Server
    participant DB as Vercel Postgres
    participant AI as LangGraph AI Agent
    participant Pusher as Pusher Service

    %% Create AI Conversation
    User->>Frontend: Click "New AI Chat"
    Frontend->>Server: createAIConversation()
    Server->>DB: Create conversation with isAiConversation=true
    Server->>DB: Add user as participant
    DB->>Server: Return conversation data
    Server->>Frontend: Return conversation
    Frontend->>User: Show empty AI conversation

    %% Send Message to AI
    User->>Frontend: Type message
    Frontend->>Server: sendMessageToAI(conversationId, content)
    Server->>DB: Create user message record
    Server->>Pusher: Broadcast user message
    Server->>AI: Send message content for processing

    %% Stream AI Response
    AI->>Server: Begin streaming response
    Server->>Pusher: Stream response chunks
    Pusher->>Frontend: Deliver response chunks
    Frontend->>User: Show typing indicator
    Frontend->>User: Display response as it arrives

    %% Complete Response
    AI->>Server: Complete response
    Server->>DB: Create AI message record
    Server->>Pusher: Send completion signal
    Pusher->>Frontend: Mark response as complete
    Frontend->>User: Show complete AI response
```

### 8. Notification System

```mermaid
sequenceDiagram
    participant Source as Event Source
    participant Server as tRPC Server
    participant DB as Vercel Postgres
    participant Pusher as Pusher Service
    participant Frontend as Next.js Frontend
    actor Recipient

    %% Create Notification
    Source->>Server: Event occurs (mention, share, etc.)
    Server->>DB: Create notification record
    DB->>Server: Return notification data
    Server->>Pusher: Trigger notification event
    Pusher->>Frontend: Deliver notification
    Frontend->>Recipient: Show notification badge

    %% View Notifications
    Recipient->>Frontend: Click notifications icon
    Frontend->>Server: getNotifications()
    Server->>DB: Query user's notifications
    DB->>Server: Return notifications
    Server->>Frontend: Return notification list
    Frontend->>Recipient: Display notifications

    %% Mark as Read
    Recipient->>Frontend: Click notification
    Frontend->>Server: markNotificationAsRead(notificationId)
    Server->>DB: Update notification.isRead
    DB->>Server: Return success
    Server->>Frontend: Return updated notification
    Frontend->>Recipient: Update notification UI
```

### 9. Document Access Control

```mermaid
sequenceDiagram
    actor Owner
    actor User
    participant Frontend as Next.js Frontend
    participant Server as tRPC Server
    participant DB as Vercel Postgres
    participant Notifier as Notification Service

    %% Grant Access
    Owner->>Frontend: Select document, user, and access level
    Frontend->>Server: grantUserDocumentAccess(documentId, userId, accessLevel)
    Server->>DB: Check if owner has admin access
    DB->>Server: Return permission status
    alt Has permission
        Server->>DB: Check if access record exists
        alt Access exists
            Server->>DB: Update access level
        else No access record
            Server->>DB: Create document_access record
            Server->>Notifier: Create access_granted notification
        end
        Server->>Frontend: Return success
        Frontend->>Owner: Show "Access granted" message
    else No permission
        Server->>Frontend: Return error
        Frontend->>Owner: Show "Permission denied" message
    end

    %% Access Document
    User->>Frontend: Navigate to document
    Frontend->>Server: getDocument(documentId)
    Server->>DB: Check user's effective access level
    DB->>Server: Return access level
    alt Has access
        Server->>DB: Get document data
        DB->>Server: Return document
        Server->>Frontend: Return document data
        Frontend->>User: Display document with appropriate controls
    else No access
        Server->>Frontend: Return access denied
        Frontend->>User: Show "Access denied" message
    end
```

### 10. Team Channel Communication

```mermaid
sequenceDiagram
    actor Admin
    actor Member
    participant Frontend as Next.js Frontend
    participant Server as tRPC Server
    participant DB as Vercel Postgres
    participant Pusher as Pusher Service
    participant Notifier as Notification Service

    %% Create Team Channel
    Admin->>Frontend: Click "Create Channel"
    Frontend->>Server: createTeamChannel(teamId, name)
    Server->>DB: Check if user has admin/owner role
    DB->>Server: Return permission status
    alt Has permission
        Server->>DB: Create conversation with type="team"
        Server->>DB: Link conversation to team
        DB->>Server: Return conversation data
        Server->>Frontend: Return channel data
        Frontend->>Admin: Show new channel
    else No permission
        Server->>Frontend: Return error
        Frontend->>Admin: Show "Permission denied" message
    end

    %% Send Message to Channel
    Member->>Frontend: Type message in channel
    Frontend->>Server: sendMessage(conversationId, content)
    Server->>DB: Create message record
    Server->>Pusher: Broadcast message to channel
    Server->>Notifier: Create notifications for team members
    Pusher->>Frontend: Deliver message to all team members
    Frontend->>Member: Show message in conversation
```

## Current Architecture

```mermaid
flowchart TD
    Frontend[Next.js Frontend]
    Server[tRPC Server]
    DB[Vercel Postgres]
    AI[LangGraph AI Agent]
    Upload[UploadThing]
    S3[S3 Storage]
    Pusher[Pusher]
    Resend[Resend Email]

    Frontend <--> Server
    Server <--> DB
    Server <--> AI
    Frontend <--> Upload
    Upload <--> S3
    Server <--> Pusher
    Pusher --> Frontend
    Server <--> Resend
```

For future architecture enhancements and recommendations, please refer to the [Roadmap](roadmap.md#future-architecture-enhancements) document.
