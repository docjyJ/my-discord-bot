FROM node:24-bookworm-slim AS base
WORKDIR /app
COPY . /app
ENV NODE_ENV=production
ENV CI=true
RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm prisma:generate
RUN pnpm build
CMD ["pnpm", "start"]
