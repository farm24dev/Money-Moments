# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

RUN npm prune --omit=dev

# Install wget for health checks
RUN apk add --no-cache wget

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "start"]
