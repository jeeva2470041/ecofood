# Backend Dockerfile - production
FROM node:20-slim

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=4005

EXPOSE 4005

# Use a non-root user
USER node

# Start the server
CMD ["node", "server.js"]
