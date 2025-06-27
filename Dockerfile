# 1. Use official Node.js 18 on Debian Bullseye
FROM node:18-bullseye

# 2. Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    libnss3 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxext6 \
    libxfixes3 \
    libglib2.0-0 \
    libgbm1 \
  && rm -rf /var/lib/apt/lists/*

# 3. Install Headless Chrome
RUN wget -qO- https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
     > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# 4. Set working directory
WORKDIR /app

# 5. Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production

# 6. Copy the rest of the source code
COPY . .

# 7. Build the Next.js app
RUN npm run build

# 8. Expose the port your Next.js app will run on
EXPOSE 3000

# 9. Point Puppeteer/Remotion at the system Chrome binary
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# 10. Start the production server
CMD ["npm", "start"]
