# syntax=docker/dockerfile:1

FROM node:24-alpine AS dependencies
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY bin ./bin
COPY --from=build /app/dist ./dist

USER node
WORKDIR /workspace
ENTRYPOINT ["node", "/app/bin/iconsync.js"]
CMD ["--help"]

