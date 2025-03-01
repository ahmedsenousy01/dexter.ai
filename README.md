# 🤖 Dexter AI - Your AI-Powered Cybersecurity Assistant

## 🌟 Overview

Dexter is an AI-powered cybersecurity assistant designed to help security engineers automate workflows, analyze data, and enhance security operations seamlessly. Unlike traditional AI models that require extensive fine-tuning, Dexter provides built-in **workflows** that integrate directly with sensitive company data, leveraging tools like **LangChain** and **LangGraph** for secure and efficient processing.

## ✨ Features

- 🧠 **AI-Powered Security Assistance** - Get real-time insights and recommendations
- 🔄 **Workflows Automation** - Execute complex security operations without manual intervention
- 🔒 **Data Processing** - Securely analyze sensitive company data without the need for extensive fine-tuning
- 🔌 **Integration with Existing Tools** - Supports APIs, logs, and databases for a seamless experience
- 👨‍💻 **Built by Security Engineers, for Security Engineers**

## 🤔 Why Dexter?

While tools like ChatGPT provide general-purpose AI capabilities, Dexter is tailored specifically for cybersecurity professionals, offering:

1. 🛡️ **Enhanced Security Workflows** - Execute predefined or custom workflows without exposing sensitive data
2. 🔗 **Seamless Enterprise Integration** - Easily integrates with existing security infrastructure
3. ⚡ **Minimal Setup & Customization** - No need to fine-tune models; just set up workflows and start using

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

- [ ] Implement core security workflows
- [ ] Develop UI/UX for seamless interaction
- [ ] Improve AI model accuracy with more security-specific datasets
- [ ] Beta testing with security professionals

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

---

**🛡️ Dexter - Built by Security Engineers, for Security Engineers.**
