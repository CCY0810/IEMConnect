# Use a lightweight Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose the port (Koyeb reads PORT env)
ENV PORT=8000
EXPOSE 8000

# Start command
CMD ["node", "server.js"]
