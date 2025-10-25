FROM node:24-bookworm-slim AS base
WORKDIR /app
COPY . /app
ENV NODE_ENV=production
ENV CI=true

# Install fonts for canvas text rendering (Noto)
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto-core \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm prisma:generate
RUN pnpm build
CMD ["pnpm", "start"]
