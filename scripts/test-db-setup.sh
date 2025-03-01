#!/bin/bash

# Test script for database setup
# This script verifies that the PostgreSQL databases are properly configured

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
WEB_ENV_FILE="${SCRIPT_DIR}/web/.env"
AGENT_ENV_FILE="${SCRIPT_DIR}/agent/.env"

echo -e "${BLUE}=== Dexter.AI Database Setup Test ===${NC}"
echo ""

# Check if Docker is running
echo -e "${YELLOW}Checking if Docker is running...${NC}"
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if docker-compose.yml exists
echo -e "${YELLOW}Checking if docker-compose.yml exists...${NC}"
if [ ! -f "$COMPOSE_FILE" ]; then
  echo -e "${RED}❌ docker-compose.yml not found at $COMPOSE_FILE${NC}"
  exit 1
fi
echo -e "${GREEN}✅ docker-compose.yml found${NC}"
echo ""

# Check if env files exist
echo -e "${YELLOW}Checking if environment files exist...${NC}"
if [ ! -f "$WEB_ENV_FILE" ]; then
  echo -e "${RED}❌ Web .env file not found at $WEB_ENV_FILE${NC}"
  echo -e "${YELLOW}Creating web/.env file...${NC}"
  mkdir -p web
  cat > web/.env << EOL
# Web application configuration
NODE_ENV=development
LANGGRAPH_API_URL=http://localhost:2024

# Drizzle
POSTGRES_URL="postgres://default:password@localhost:5432/dexter?sslmode=require"
POSTGRES_PRISMA_URL="postgres://default:password@localhost:5432/dexter?sslmode=require&pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NO_SSL="postgres://default:password@localhost:5432/dexter"
POSTGRES_URL_NON_POOLING="postgres://default:password@localhost:5432/dexter?sslmode=require"
POSTGRES_USER="default"
POSTGRES_HOST="localhost"
POSTGRES_PASSWORD="password"
POSTGRES_DATABASE="dexter"
EOL
  echo -e "${GREEN}✅ web/.env created successfully!${NC}"
fi

# Create local environment file for testing
echo -e "${YELLOW}Creating environment file...${NC}"
cat > "$AGENT_ENV_FILE" << EOL
# API Keys 
GOOGLE_API_KEY=your-google-api-key
OPENAI_API_KEY=your-openai-api-key
LANGSMITH_API_KEY=your-langsmith-api-key

# Database configuration for local testing
POSTGRES_DB=langgraph
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5433

# Local services for testing
REDIS_URI=redis://langgraph-redis:6379
POSTGRES_URI=postgres://postgres:postgres@langgraph-postgres:5432/langgraph?sslmode=disable
EOL
echo -e "${GREEN}✅ Environment file created at $AGENT_ENV_FILE${NC}"
echo ""

# Create Docker network if it doesn't exist
echo -e "${YELLOW}Checking if Docker network exists...${NC}"
if ! docker network inspect dexter-network > /dev/null 2>&1; then
  echo -e "${YELLOW}Creating Docker network 'dexter-network'...${NC}"
  docker network create dexter-network
  echo -e "${GREEN}✅ Docker network created${NC}"
else
  echo -e "${GREEN}✅ Docker network already exists${NC}"
fi
echo ""

# Start PostgreSQL service for LangGraph
echo -e "${YELLOW}Starting PostgreSQL service for LangGraph...${NC}"
docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" up -d langgraph-postgres
echo -e "${GREEN}✅ PostgreSQL service started${NC}"
echo ""

# Wait for PostgreSQL service to be ready
echo -e "${YELLOW}Waiting for PostgreSQL service to be ready...${NC}"
echo -e "${YELLOW}This may take a few seconds...${NC}"
sleep 10

# Check if LangGraph PostgreSQL is accessible
echo -e "${YELLOW}Checking if LangGraph PostgreSQL is accessible...${NC}"
if docker exec -it $(docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" ps -q langgraph-postgres) pg_isready -U postgres; then
  echo -e "${GREEN}✅ LangGraph PostgreSQL is accessible${NC}"
else
  echo -e "${RED}❌ LangGraph PostgreSQL is not accessible${NC}"
  exit 1
fi
echo ""

# Start Redis service for LangGraph
echo -e "${YELLOW}Starting Redis service for LangGraph...${NC}"
docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" up -d langgraph-redis
echo -e "${GREEN}✅ Redis service started${NC}"
echo ""

# Wait for Redis to be ready
echo -e "${YELLOW}Waiting for Redis to be ready...${NC}"
sleep 5

# Check if Redis is accessible
echo -e "${YELLOW}Checking if Redis is accessible...${NC}"
REDIS_CONTAINER=$(docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" ps -q langgraph-redis)
if [ -z "$REDIS_CONTAINER" ]; then
  echo -e "${RED}❌ Redis container not found${NC}"
  exit 1
fi

if docker exec "$REDIS_CONTAINER" redis-cli ping | grep -q "PONG"; then
  echo -e "${GREEN}✅ Redis is accessible${NC}"
else
  echo -e "${RED}❌ Redis is not accessible${NC}"
  exit 1
fi
echo ""

echo -e "${YELLOW}Testing connection to remote web database...${NC}"
# Extract connection details from web/.env
if [ -f "$WEB_ENV_FILE" ]; then
  # Source the .env file to get variables
  source <(grep -v '^#' "$WEB_ENV_FILE" | sed -E 's/(.*)=(.*)/export \1="\2"/')
  
  # Remove quotes from variables
  POSTGRES_URL=$(echo $POSTGRES_URL | tr -d '"')
  POSTGRES_USER=$(echo $POSTGRES_USER | tr -d '"')
  POSTGRES_HOST=$(echo $POSTGRES_HOST | tr -d '"')
  POSTGRES_PASSWORD=$(echo $POSTGRES_PASSWORD | tr -d '"')
  POSTGRES_DATABASE=$(echo $POSTGRES_DATABASE | tr -d '"')
  
  echo -e "${YELLOW}Using connection settings:${NC}"
  echo "POSTGRES_URL=$POSTGRES_URL"
  echo "POSTGRES_USER=$POSTGRES_USER"
  echo "POSTGRES_HOST=$POSTGRES_HOST"
  echo "POSTGRES_DATABASE=$POSTGRES_DATABASE"
  
  # Test connection to remote database
  if command -v psql > /dev/null; then
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" -c "SELECT 1" > /dev/null 2>&1; then
      echo -e "${GREEN}✅ Remote web database is accessible${NC}"
    else
      echo -e "${RED}❌ Remote web database is not accessible${NC}"
      echo -e "${YELLOW}⚠️ This is expected if you're using a remote database that's not publicly accessible.${NC}"
      echo -e "${YELLOW}⚠️ Make sure your web application is configured correctly to connect to the remote database.${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️ psql command not found. Cannot test remote database connection.${NC}"
    echo -e "${YELLOW}⚠️ Install PostgreSQL client tools to test the connection.${NC}"
  fi
fi
echo ""

echo -e "${BLUE}=== Database Setup Test Complete ===${NC}"
echo -e "${GREEN}✅ LangGraph database services are working correctly!${NC}"
echo ""
echo -e "You can now run the full application with:"
echo -e "${YELLOW}./dexter.sh start${NC}"
echo ""
echo -e "To clean up the test environment, run:"
echo -e "${YELLOW}docker compose -f $COMPOSE_FILE --env-file $AGENT_ENV_FILE down${NC}"
