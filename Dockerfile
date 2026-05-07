FROM node:26.0.0-alpine3.23
WORKDIR /app
COPY . /app
ENV NODE_ENV=production
ENV CI=true

RUN npm install -g pnpm@9 && \
    pnpm install --frozen-lockfile --prod=false && \
    DATABASE_URL="file:/db/database.db" pnpm prisma:generate && \
    pnpm build

CMD ["pnpm", "start"]
