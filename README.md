# 🤖 Dexter AI - Your AI-Powered Collaborative Document Platform

## 🌟 Overview

Dexter.ai is a collaborative document management and communication platform that integrates AI capabilities to enhance productivity. The platform enables users to create teams, manage documents with version control, request and submit reviews, and communicate through private and team-based conversations.

## ✨ Features

- 🧠 **AI-Powered Document Generation** - Create documents with AI assistance
- 🔄 **Document Workflow Management** - Request reviews, track versions, and manage document status
- 🔒 **Team Collaboration** - Create teams, invite members, and manage permissions
- 🔌 **Real-time Communication** - Chat with team members and AI assistant
- 👨‍💻 **Seamless Integration** - Mention users, documents, and conversations in messages

## 🤔 Why Dexter?

While tools like Google Docs provide document management and Microsoft Teams offers communication, Dexter.ai combines these features with AI capabilities, offering:

1. 🛡️ **Enhanced Document Workflows** - Request reviews, track versions, and manage document status
2. 🔗 **Seamless Team Collaboration** - Create teams, invite members, and manage permissions
3. ⚡ **AI-Powered Assistance** - Generate documents, get AI responses in conversations

## 🚀 Getting Started

### System Requirements

- Docker and Docker Compose
- Python 3.13+ (for development)
- Node.js 20+ (for development)
- Rust 1.79+ (for development)

### Prerequisites

- Docker and Docker Compose installed
- API keys for:
  - OpenAI (`OPENAI_API_KEY`)
  - Google AI (`GOOGLE_API_KEY`)
  - LangSmith (`LANGSMITH_API_KEY`)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/ahmedsenousy01/dexter.ai.git
cd dexter.ai
```

2. **Environment Setup**

Create the necessary environment files:

```bash
# Create web/.env file
cat > web/.env << EOL
# Web application configuration
NODE_ENV=production
DATABASE_URL=file:/app/data/db.sqlite
LANGGRAPH_API_URL=http://langgraph-api:8000
EOL

# Create agent/.env file
cat > agent/.env << EOL
# API Keys
GOOGLE_API_KEY="your-google-api-key"
OPENAI_API_KEY="your-openai-api-key"
LANGSMITH_API_KEY="your-langsmith-api-key"

# Database configuration
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5433

# Service URIs
REDIS_URI=redis://langgraph-redis:6379
POSTGRES_URI=postgres://postgres:postgres@langgraph-postgres:5432/postgres?sslmode=disable
EOL
```

3. **Make the management script executable**

```bash
chmod +x dexter.sh
```

4. **Build and start the application**

```bash
# Build the LangGraph image
./dexter.sh build

# Start all services
./dexter.sh start
```

The setup includes:

- 🌐 Web Frontend (Next.js)
- 🤖 LangGraph API service
- 🗄️ PostgreSQL database
- 📦 Redis cache

### Using the Management Script

The `dexter.sh` script provides several commands to manage the application:

```bash
# Check status of all services
./dexter.sh status

# View logs
./dexter.sh logs

# View logs for a specific service
./dexter.sh logs langgraph-api

# Follow logs
./dexter.sh logs langgraph-api follow

# Test the API
./dexter.sh test-api

# Restart all services
./dexter.sh restart

# Stop all services
./dexter.sh stop

# Stop and remove volumes
./dexter.sh clean
```

### Accessing the Services

- Web Application: http://localhost:3000
- LangGraph API: http://localhost:8123

## 🗺️ Roadmap

Our implementation plan is divided into several phases:

### Current Status

- **Phase**: Initial Setup
- **Progress**: 5% Complete
- **Current Focus**: Project Setup and Database Schema
- **Next Milestone**: Authentication System

### Key Milestones

1. **Project Setup & Database Schema** - Est. 3 days

   - Set up Next.js, Drizzle ORM, tRPC, and other dependencies
   - Define database schema for users, teams, documents, etc.

2. **Authentication with Next-Auth** - Est. 2 days

   - Implement OAuth providers (Google, GitHub)
   - Set up session management

3. **User & Team Management** - Est. 3 days

   - User profile management
   - Team creation and invitation system
   - Role-based access control

4. **Conversations & Messaging** - Est. 4 days

   - Private and team conversations
   - Real-time messaging with Pusher
   - @mentions and notifications

5. **Document Management** - Est. 4 days

   - Document upload and version control
   - Review request system
   - Access control and sharing

6. **AI Integration** - Est. 3 days

   - AI document generation
   - AI-assisted conversations

7. **UI/UX Implementation** - Est. 5 days

   - Dashboard layout
   - Responsive design
   - Core views (team, conversation, document)

8. **Testing & Deployment** - Est. 5 days
   - Unit and integration tests
   - Performance optimization
   - CI/CD pipeline setup

### Future Enhancements

The roadmap also includes plans for future architectural enhancements as the application scales, including:

- Caching layer for improved performance
- Search service for content discovery
- Monitoring and analytics integration
- Rate limiting for API protection
- CDN integration for global performance

For a detailed roadmap and future architecture plans, see [roadmap.md](roadmap.md).

## 🧩 Core Features

### User Management

- OAuth authentication with Next-Auth
- User profile management
- Account settings

### Team Collaboration

- Team creation and management
- Role-based access control (owner, admin, member)
- Team invitation system

### Conversations and Messaging

- Private conversations between users
- Team channels for group discussions
- AI conversations with the Dexter assistant
- Real-time message delivery through Pusher
- @mentions for users, documents, and conversations

### Document Management

- Document upload and AI generation
- Version control with semantic versioning
- Document sharing and access control
- Review request and submission workflow
- Document status management (draft, published, archived)

### Notifications

- Real-time notifications for mentions, shares, and reviews
- Email notifications for important events
- Notification center for managing all notifications

## 🏗️ Technical Architecture

### Database Schema

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

### Tech Stack

- **Framework**: Next.js 15.2.0
- **Database**: Vercel Postgres
- **ORM**: Drizzle ORM 0.40.0
- **API Layer**: tRPC 11.0.0-rc.446
- **Authentication**: Next-Auth 5.0.0
- **File Uploads**: UploadThing 7.5.2 (integrated with S3)
- **State Management**: Zustand 5.0.3
- **Real-time**: Pusher 5.2.0
- **Email Service**: Resend
- **Validation**: Zod 3.24.2
- **UI**: Tailwind CSS 4.0.9

### Current Architecture

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

## Development

For development, you can run the services separately:

### Prerequisites

- Python 3.13+
- Node.js 20+
- Rust 1.79+

### Install Development Tools

We provide a convenient script to install all required development tools:

```bash
# Make the script executable
chmod +x scripts/install_dev_tools.sh

# Run the installation script
./scripts/install_dev_tools.sh
```

This script installs:

- Rust (via rustup)
- Node.js v20 (via NVM)
- uv (Python package manager)

The script includes status checks to verify each tool is installed correctly.

### Development Mode

You can use the `dexter.sh` script to run the application in development mode:

```bash
# Start LangGraph API in development mode
./dexter.sh dev

# In a separate terminal, start the web application in development mode
./dexter.sh dev-web
```

The development mode provides:

1. Automatic environment setup (creates necessary .env files if they don't exist)
2. Checks for required development tools and installs them if needed
3. Runs the LangGraph API in development mode with hot reloading
4. Runs the web application with hot reloading

### Manual Development Setup

If you prefer to start services manually:

#### Agent Development

```bash
cd agent

# Start the LangGraph development server
uv run langgraph dev --config langgraph-dev.json --no-browser
```

The LangGraph server will be available at:

- API: http://localhost:2024
- Docs: http://localhost:2024/docs
- LangGraph Studio Web UI: https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024

#### Web Development

```bash
cd web
pnpm install
pnpm dev
```

### Development Services

When running in development mode, the following services will be available:

- LangGraph API: http://localhost:2024
- LangGraph API Docs: http://localhost:2024/docs
- LangGraph Studio: https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
- Web Application: http://localhost:3000

## 📚 Documentation

For more detailed information, please refer to the following documents:

- [Design Document](design-doc.md): Detailed technical design and implementation details
- [Roadmap](roadmap.md): Implementation plan and milestones
- [Use Cases](use-cases.md): Detailed functional requirements and use cases
- [Sequence Diagrams](sequence-diagrams.md): Detailed sequence diagrams for key use cases

---

**🤖 Dexter.ai - Collaborative Document Management with AI**
