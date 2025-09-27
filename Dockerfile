# ---- Dependencies Stage ----
    FROM node:18-alpine AS deps
    WORKDIR /usr/src/app
    COPY package*.json ./
    RUN npm ci --only=production
    
    # ---- Dev Dependencies Stage ----
    FROM node:18-alpine AS dev-deps
    WORKDIR /usr/src/app
    COPY package*.json ./
    RUN npm ci
    
    # ---- Build Stage ----
    FROM dev-deps AS builder
    WORKDIR /usr/src/app
    COPY . .
    RUN npm run build
    
    # ---- Development Stage ----
    FROM dev-deps AS development
    WORKDIR /usr/src/app
    COPY . .
    RUN npm install -g nodemon
    EXPOSE 3000
    CMD ["npm", "run", "dev"]
    
    # ---- Production Stage ----
    FROM node:18-alpine AS production
    WORKDIR /usr/src/app
    
    # Copy production dependencies
    COPY --from=deps /usr/src/app/node_modules ./node_modules
    COPY --from=deps /usr/src/app/package*.json ./
    
    # Copy compiled code
    COPY --from=builder /usr/src/app/dist ./dist
    
    # Create non-root user
    RUN addgroup -g 1001 -S nodejs && \
        adduser -S nodejs -u 1001
    RUN chown -R nodejs:nodejs /usr/src/app
    USER nodejs
    
    ENV NODE_ENV=production
    EXPOSE 3000
    CMD ["node", "dist/server.js"]