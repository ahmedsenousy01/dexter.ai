#!/bin/bash

# Dexter.AI Management Script
# This script provides commands to manage the Dexter.AI application stack

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
WEB_ENV_FILE="${SCRIPT_DIR}/web/.env"
AGENT_ENV_FILE="${SCRIPT_DIR}/agent/.env"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to display usage information
function show_usage {
  echo -e "Usage: $0 ${YELLOW}[command]${NC}"
  echo ""
  echo "Commands:"
  echo -e "  ${GREEN}build${NC}       - Build the LangGraph Docker image"
  echo -e "  ${GREEN}start${NC}       - Start all services"
  echo -e "  ${GREEN}stop${NC}        - Stop all services"
  echo -e "  ${GREEN}restart${NC}     - Restart all services"
  echo -e "  ${GREEN}logs${NC}        - View logs from all services"
  echo -e "  ${GREEN}status${NC}      - Check the status of all services"
  echo -e "  ${GREEN}test-api${NC}    - Test if the LangGraph API is running correctly"
  echo -e "  ${GREEN}clean${NC}       - Stop services and remove volumes"
  echo -e "  ${GREEN}dev${NC}         - Start services in development mode"
  echo -e "  ${GREEN}dev-web${NC}     - Start web application in development mode"
  echo -e "  ${GREEN}help${NC}        - Show this help message"
  echo ""
}

# Function to check if a command exists
function command_exists {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if the env files exist
function check_env_files {
  local missing_files=0
  
  if [ ! -f "$WEB_ENV_FILE" ]; then
    echo -e "${RED}Error: Web .env file not found at $WEB_ENV_FILE${NC}"
    missing_files=1
  fi
  
  if [ ! -f "$AGENT_ENV_FILE" ]; then
    echo -e "${RED}Error: Agent .env file not found at $AGENT_ENV_FILE${NC}"
    missing_files=1
  fi
  
  if [ $missing_files -eq 1 ]; then
    echo "Please create the missing .env files with the required environment variables."
    exit 1
  fi
}

# Function to build the LangGraph image
function build_langgraph {
  echo -e "${GREEN}Building LangGraph Docker image...${NC}"
  
  # Check if langgraph CLI is installed
  if ! command -v langgraph &> /dev/null; then
    echo -e "${RED}Error: langgraph CLI is not installed${NC}"
    echo "Please install it with: pip install langgraph-cli"
    exit 1
  fi
  
  # Navigate to the agent directory
  cd "$SCRIPT_DIR/agent" || { echo -e "${RED}Error: agent directory not found${NC}"; exit 1; }
  
  # Build the Docker image
  langgraph build --tag dexter-langgraph
  
  echo -e "${GREEN}LangGraph Docker image built successfully!${NC}"
  cd "$SCRIPT_DIR" || exit
}

# Function to start the stack
function start_stack {
  check_env_files
  
  echo -e "${GREEN}Starting the Docker Compose stack...${NC}"
  docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" up -d
  
  echo ""
  echo -e "Services are starting. Check status with: ${YELLOW}$0 status${NC}"
}

# Function to stop the stack
function stop_stack {
  echo -e "${GREEN}Stopping the Docker Compose stack...${NC}"
  docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" down
}

# Function to restart the stack
function restart_stack {
  stop_stack
  start_stack
}

# Function to view logs
function view_logs {
  local service="$1"
  local follow="$2"
  
  echo -e "${GREEN}Viewing logs...${NC}"
  
  if [ -n "$service" ]; then
    if [ "$follow" = "follow" ]; then
      docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" logs -f "$service"
    else
      docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" logs "$service"
    fi
  else
    if [ "$follow" = "follow" ]; then
      docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" logs -f
    else
      docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" logs
    fi
  fi
}

# Function to check status
function check_status {
  echo -e "${GREEN}Checking status of Docker containers...${NC}"
  echo ""
  
  # Get the list of services from docker-compose.yml
  SERVICES=$(docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" config --services)
  
  # Check the status of each service
  for SERVICE in $SERVICES; do
    echo -n "Service $SERVICE: "
    
    # Check if the container is running
    RUNNING=$(docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" ps --status running "$SERVICE" | grep -q "$SERVICE" && echo "true" || echo "false")
    
    if [ "$RUNNING" = "true" ]; then
      echo -e "${GREEN}✅ Running${NC}"
      
      # Check if the service has a health check
      CONTAINER_ID=$(docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" ps -q "$SERVICE")
      
      if docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null | grep -q "healthy"; then
        echo -e "   Health: ${GREEN}✅ Healthy${NC}"
      elif docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null | grep -q "unhealthy"; then
        echo -e "   Health: ${RED}❌ Unhealthy${NC}"
      elif docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null | grep -q "starting"; then
        echo -e "   Health: ${YELLOW}⏳ Starting${NC}"
      fi
    else
      echo -e "${RED}❌ Not running${NC}"
    fi
  done
  
  echo ""
  echo -e "To view detailed status: ${YELLOW}docker compose -f $COMPOSE_FILE --env-file $AGENT_ENV_FILE ps${NC}"
  echo -e "To view logs: ${YELLOW}docker compose -f $COMPOSE_FILE --env-file $AGENT_ENV_FILE logs -f${NC}"
}

# Function to test the API
function test_api {
  echo -e "${GREEN}Testing LangGraph API...${NC}"
  
  # Test the health endpoint
  echo -n "Health check: "
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8123/ok" | grep -q "200"; then
    echo -e "${GREEN}✅ API is healthy${NC}"
  else
    echo -e "${RED}❌ API is not responding${NC}"
    exit 1
  fi
  
  # Test the assistants search endpoint
  echo -n "Assistants list: "
  RESPONSE=$(curl -s -X POST "http://localhost:8123/assistants/search" -H "Content-Type: application/json" -d '{}')
  if echo "$RESPONSE" | grep -q "assistant_id"; then
    echo -e "${GREEN}✅ API returned assistants list${NC}"
    echo "Available assistants:"
    echo "$RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | sed 's/^/- /'
  else
    echo -e "${RED}❌ Failed to get assistants list${NC}"
    exit 1
  fi
  
  echo ""
  echo -e "${GREEN}✅ LangGraph API is running correctly!${NC}"
}

# Function to clean up
function clean_stack {
  echo -e "${GREEN}Stopping services and removing volumes...${NC}"
  docker compose -f "$COMPOSE_FILE" --env-file "$AGENT_ENV_FILE" down -v
}

# Function to check for required development tools
function check_dev_tools {
  echo -e "${GREEN}Checking for required development tools...${NC}"
  local missing_tools=false
  
  if ! command_exists rustc; then
    echo -e "${YELLOW}⚠️ Rust is not installed.${NC}"
    missing_tools=true
  fi
  
  if ! command_exists node; then
    echo -e "${YELLOW}⚠️ Node.js is not installed.${NC}"
    missing_tools=true
  fi
  
  if ! command_exists uv; then
    echo -e "${YELLOW}⚠️ uv is not installed.${NC}"
    missing_tools=true
  fi
  
  # Check for pnpm
  if ! command_exists pnpm; then
    echo -e "${YELLOW}⚠️ pnpm is not installed. Installing now...${NC}"
    npm install -g pnpm
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ pnpm installed successfully!${NC}"
    else
      echo -e "${RED}❌ pnpm installation failed!${NC}"
      missing_tools=true
    fi
  fi
  
  # Run installation script if tools are missing
  if [ "$missing_tools" = true ]; then
    echo -e "${YELLOW}Some development tools are missing. Running installation script...${NC}"
    
    if [ -f "${SCRIPT_DIR}/scripts/install_dev_tools.sh" ]; then
      chmod +x "${SCRIPT_DIR}/scripts/install_dev_tools.sh"
      "${SCRIPT_DIR}/scripts/install_dev_tools.sh"
      
      # Verify installation was successful
      local install_failed=false
      if ! command_exists rustc; then
        echo -e "${RED}❌ Rust installation failed.${NC}"
        install_failed=true
      fi
      
      if ! command_exists node; then
        echo -e "${RED}❌ Node.js installation failed.${NC}"
        install_failed=true
      fi
      
      if ! command_exists uv; then
        echo -e "${RED}❌ uv installation failed.${NC}"
        install_failed=true
      fi
      
      if [ "$install_failed" = true ]; then
        echo -e "${RED}❌ Some tools could not be installed. Please install them manually.${NC}"
        exit 1
      fi
    else
      echo -e "${RED}❌ Installation script not found at ${SCRIPT_DIR}/scripts/install_dev_tools.sh${NC}"
      echo -e "Please install the required tools manually or create the installation script."
      exit 1
    fi
  fi
  
  echo -e "${GREEN}✅ All development tools are installed!${NC}"
}

# Function to create development environment files
function create_dev_env_files {
  # Check for web/.env
  if [ ! -f "web/.env" ]; then
    echo -e "${YELLOW}Creating web/.env file...${NC}"
    mkdir -p web
    cat > web/.env << EOL
# Web application configuration
NODE_ENV=development
DATABASE_URL=file:./data/db.sqlite
LANGGRAPH_API_URL=http://localhost:2024
EOL
    echo -e "${GREEN}✅ web/.env created successfully!${NC}"
  fi
  
  # Check for agent/.env
  if [ ! -f "agent/.env" ]; then
    echo -e "${YELLOW}Creating agent/.env file...${NC}"
    mkdir -p agent
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
REDIS_URI=redis://localhost:6379
POSTGRES_URI=postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable
EOL
    echo -e "${GREEN}✅ agent/.env created successfully!${NC}"
    echo -e "${YELLOW}⚠️ Please update agent/.env with your actual API keys${NC}"
  fi
}

# Function to start LangGraph API in development mode
function start_dev_langgraph {
  echo -e "${GREEN}Starting LangGraph API in development mode...${NC}"
  
  # Check if port 2024 is already in use
  if lsof -Pi :2024 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️ Port 2024 is already in use. LangGraph API might already be running.${NC}"
  else
    # Start LangGraph API in the background
    (cd agent && uv run langgraph dev --config langgraph-dev.json --no-browser) &
    LANGGRAPH_PID=$!
    echo -e "${GREEN}✅ LangGraph API started with PID: $LANGGRAPH_PID${NC}"
    
    # Give LangGraph API time to start
    sleep 5
  fi
  
  echo ""
  echo -e "${GREEN}✅ LangGraph API is now running!${NC}"
  echo -e "📊 LangGraph API: ${YELLOW}http://localhost:2024${NC}"
  echo -e "📝 LangGraph Studio: ${YELLOW}https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024${NC}"
  echo -e "💻 Web Application: ${YELLOW}http://localhost:3000${NC}"
  echo ""
  echo -e "To start the web application only, run: ${YELLOW}$0 dev-web${NC}"
  echo ""
  echo -e "Press ${YELLOW}Ctrl+C${NC} to stop the LangGraph API"
  
  # Handle shutdown for LangGraph API
  trap "kill $LANGGRAPH_PID 2>/dev/null; echo -e '${RED}🛑 LangGraph API stopped${NC}'; exit 0" INT TERM
  
  # Wait for LangGraph API process to finish
  wait $LANGGRAPH_PID
}

# Function to start web application in development mode
function start_dev_web {
  echo -e "${GREEN}Starting web application in development mode...${NC}"
  
  if [ -d "web" ]; then
    # Check if package.json exists
    if [ -f "web/package.json" ]; then
      cd web
      pnpm install
      pnpm dev
    else
      echo -e "${RED}❌ web/package.json not found. Web application could not be started.${NC}"
      exit 1
    fi
  else
    echo -e "${RED}❌ web directory not found. Web application could not be started.${NC}"
    exit 1
  fi
}

# Main script logic
case "$1" in
  build)
    build_langgraph
    ;;
  start)
    start_stack
    ;;
  stop)
    stop_stack
    ;;
  restart)
    restart_stack
    ;;
  logs)
    view_logs "$2" "$3"
    ;;
  status)
    check_status
    ;;
  test-api)
    test_api
    ;;
  clean)
    clean_stack
    ;;
  dev)
    check_dev_tools
    create_dev_env_files
    start_dev_langgraph
    ;;
  dev-web)
    check_dev_tools
    create_dev_env_files
    start_dev_web
    ;;
  help|--help|-h)
    show_usage
    ;;
  *)
    show_usage
    exit 1
    ;;
esac

exit 0 
