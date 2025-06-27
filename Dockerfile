FROM node:18-bullseye

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
  wget ca-certificates fonts-liberation libgtk-3-0 libx11-xcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxrandr2 libxss1 libxtst6 libnss3 libasound2 \
  libpangocairo-1.0-0 libxext6 libxfixes3 libglib2.0-0 libgbm1 \
  && rm -rf /var/lib/apt/lists/*

# Install headless Chrome
RUN wget -qO- https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
    > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# App setup
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . .

# Ensure Remotion uses the system Chrome
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

EXPOSE 3000
CMD ["npm", "start"]
