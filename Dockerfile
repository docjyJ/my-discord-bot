FROM node:24.14.1-alpine3.23@sha256:5bc53106902596d90fb497746b74ea40e0625c1c8327681d6bff3ee6ad42a22b
WORKDIR /app
COPY . /app
ENV NODE_ENV=production
ENV CI=true

RUN npm install -g pnpm@9 && \
    pnpm install --frozen-lockfile --prod=false && \
    DATABASE_URL="file:/db/database.db" pnpm prisma:generate && \
    pnpm build

CMD ["pnpm", "start"]
