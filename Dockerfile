FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build


RUN npm prune --omit=dev

FROM node:24-alpine

WORKDIR /app


COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=9999

EXPOSE 9999

CMD ["node", "--no-warnings", "build/server.js"]