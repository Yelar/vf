FROM node:18-bullseye AS builder

# Install Chromium dependencies
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

# Install Headless Chrome
RUN wget -qO- https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
     > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Set environment variables for build
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV NODE_ENV=production

# Build the Next.js app
RUN npm run build

# Production stage
FROM node:18-bullseye-slim AS runner

# Install Chrome dependencies and Chrome
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
    google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Set production environment variables
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Expose the port
EXPOSE 3000

# Start the production server
CMD ["npm", "start"]
