# Docker Setup for Dexter.AI

This guide explains how to run the Dexter.AI project using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

1. **Clone the repository**

```bash
git clone <repository-url>
cd dexter.ai
```

2. **Set up environment variables**

Copy the example environment file:

```bash
cp .env.docker.example .env
```

Modify any variables in `.env` as needed for your environment.

3. **Build and start the containers**

```bash
docker-compose up -d --build
```

This command builds all the images and starts the containers in detached mode.

4. **Access the application**

- Frontend (Next.js): http://localhost:3000
- Backend API (Hono): http://localhost:8000

## Service Architecture

The Dockerized application consists of three main services:

- **web**: Next.js frontend application
- **server**: Hono API server
- **agent**: Python agent

All services are connected through a Docker network named `dexter-network`.

## Container Management

### View running containers

```bash
docker-compose ps
```

### View logs

View logs from all services:

```bash
docker-compose logs
```

View logs from a specific service:

```bash
docker-compose logs web
docker-compose logs server
docker-compose logs agent
```

Add `-f` to follow the logs:

```bash
docker-compose logs -f
```

### Stop the containers

```bash
docker-compose down
```

### Rebuild a specific service

```bash
docker-compose build web
docker-compose up -d
```

## Development Workflow

For development, you might want to mount your local code directory to the
container for hot-reloading capabilities.

Modify the docker-compose.yml file to add volumes:

```yaml
services:
  web:
    # ... other config
    volumes:
      - ./web:/app
      - /app/node_modules
```

## Troubleshooting

### Containers not starting

Check the logs:

```bash
docker-compose logs
```

### Network issues between containers

Make sure all services are on the same network:

```bash
docker network inspect dexter-network
```
