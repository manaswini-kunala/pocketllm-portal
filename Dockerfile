# Stage 1: Build the React Client
FROM node:18-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Setup the Node.js Server
FROM node:18-slim
WORKDIR /app/server

# Install system dependencies for Prisma (openssl)
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Copy server dependencies
COPY server/package*.json ./
RUN npm install

# Copy server source code
COPY server/ ./

# Pre-download models
RUN node scripts/download_models.js

# Copy built client assets from Stage 1
# We copy them to ../client/dist because that's where server/index.js expects them
COPY --from=client-build /app/client/dist ../client/dist

# Generate Prisma Client
RUN npx prisma generate

# Expose the port
EXPOSE 3001

# Start the server
# We use a shell script or command chain to ensure migrations run before start
CMD ["sh", "-c", "npx prisma migrate deploy && node seed.js && node --expose-gc index.js"]
