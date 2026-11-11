FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# Written by Taglore before docker build
COPY release-notes/ ./release-notes/
CMD ["node", "server.js"]
