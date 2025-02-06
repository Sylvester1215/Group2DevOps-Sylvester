# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Install pm2 globally
RUN npm install pm2 -g

# Set PM2 public and secret keys as environment variables (for PM2 runtime or monitoring)
ENV PM2_PUBLIC_KEY 93vmbooi7hk424q
ENV PM2_SECRET_KEY rq959zxe4sy6rwn

# Bundle app source
COPY . .

# Expose the port your app runs on
EXPOSE 5050

# Define the command to run your app
CMD ["pm2-runtime", "index.mjs" ]
