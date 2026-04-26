FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY packages/api/package.json ./packages/api/package.json

# Install dependencies
RUN cd packages/api && npm install

# Copy source code
COPY packages/api ./packages/api

# Set working directory to API
WORKDIR /app/packages/api

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]