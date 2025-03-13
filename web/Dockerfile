FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm
RUN pnpm install

# Copy source code
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV SKIP_ENV_VALIDATION 1

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Set proper environment for production
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start application
CMD ["pnpm", "start"] 
