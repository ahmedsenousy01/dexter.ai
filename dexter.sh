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
  echo -e "  ${GREEN}help${NC}        - Show this help message"
  echo ""
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
  help|--help|-h)
    show_usage
    ;;
  *)
    show_usage
    exit 1
    ;;
esac

exit 0 
