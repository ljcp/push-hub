FROM node:16-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Expose HTTP port
EXPOSE 3000
# (Optional) Expose MQTT port if embedding a broker
EXPOSE 1883

# Start the service
CMD ["npm", "start"]