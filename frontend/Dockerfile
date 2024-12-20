# Stage 1: Build the React app
FROM node:16-alpine as build

WORKDIR /app

# Copy only package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy the rest of the app source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the app using Nginx
FROM nginx:alpine

# Copy the built app from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose the necessary port
EXPOSE 80

# Start the Nginx server
CMD ["nginx", "-g", "daemon off;"]
