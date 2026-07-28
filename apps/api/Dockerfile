# Serves three roles from one image, differentiated only by the container
# command/working directory set in the ECS task definition:
#   - api server:      workdir /app/apps/api, cmd ["node","dist/server.js"]
#   - webhook worker:   workdir /app/apps/api, cmd ["node","dist/worker.js"]
#   - migration task:   workdir /app,          cmd ["pnpm","--filter","@chiklati/db","run","migrate:deploy"]
#
# Deliberately NOT using `pnpm deploy` to flatten a prod-only image: that
# breaks `pnpm --filter` (no workspace context left) and drops the `prisma`
# CLI's bin symlink, which the migration task needs. Shipping the full built
# monorepo costs some image size but keeps every entrypoint actually working.

FROM node:20-bookworm-slim AS base
# bookworm-slim ships no OpenSSL; without it Prisma's engine can't detect
# libssl and silently defaults to the wrong build (confirmed via the
# "Prisma failed to detect the libssl/openssl version" warning otherwise).
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
# Corepack's default cache lives under $HOME, which differs between the root
# user active at build time and the non-root apiuser active at runtime --
# without a shared, world-readable cache dir, the migration task's `pnpm
# --filter` invocation would silently re-download pnpm from npm on every
# deploy (confirmed empirically). Pin it so build-time caching actually helps.
ENV COREPACK_HOME=/opt/corepack
RUN mkdir -p /opt/corepack && chmod -R a+rX /opt/corepack
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune @chiklati/api --docker

FROM base AS installer
WORKDIR /app
# Copy full pruned source (not just out/json) before installing: the root
# package.json's postinstall runs `prisma generate`, which needs
# packages/db/prisma/schema.prisma to already be on disk.
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@chiklati/api...

FROM installer AS runner
WORKDIR /app/apps/api
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs apiuser
# apiuser has no home directory (useradd --system doesn't create one); corepack
# needs a writable HOME for its own cache -- confirmed via EACCES on
# /home/apiuser/.cache when running the migration task's `pnpm --filter` command.
ENV HOME=/tmp
USER apiuser
EXPOSE 4000
CMD ["node", "dist/server.js"]
