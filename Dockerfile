FROM node:18 AS builder

WORKDIR /app

RUN npm install -g pnpm@9.10.0

COPY package*.json .

COPY prisma ./prisma/

RUN pnpm install

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

COPY . .

RUN pnpm prisma:gen

RUN pnpm build

FROM node:18 AS runner

WORKDIR /app

RUN npm install -g pnpm@9.10.0

COPY --chown=node:node --from=builder /app/prisma /app/prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --prod

EXPOSE 3000

CMD ["node", "dist/main.js"]
