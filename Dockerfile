# Use Node 18
FROM node:18-bullseye-slim

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose the port commonly used by Hugging Face (it sets PORT env var automatically, but good to doc)
EXPOSE 7860

# Start command
CMD [ "node", "server.js" ]
