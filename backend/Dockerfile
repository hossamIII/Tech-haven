# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and lock files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Set environment variables (can also be set in Railway dashboard)
ENV NODE_ENV=production

# Expose Medusa port
EXPOSE 9000

# Run the Medusa server
CMD ["npm", "run", "start"]
