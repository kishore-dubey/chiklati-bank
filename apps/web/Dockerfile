FROM node:20-bookworm-slim AS base
# bookworm-slim ships no OpenSSL; without it Prisma's engine can't detect
# libssl and silently defaults to the wrong build (confirmed via the
# "Prisma failed to detect the libssl/openssl version" warning otherwise).
# apps/web ships a copy of @chiklati/db's generated Prisma client (see the
# runner stage below), so it needs this too, not just apps/api.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune @chiklati/web --docker

FROM base AS installer
WORKDIR /app
# Copy full pruned source (not just out/json) before installing: the root
# package.json's postinstall runs `prisma generate`, which needs
# packages/db/prisma/schema.prisma to already be on disk.
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# next build actually executes server code while collecting page data,
# which runs webEnvSchema validation -- these placeholders only need to be
# well-formed, never connected to. Confined to this stage: `runner` starts
# fresh FROM base, so real secrets injected by ECS at runtime are untouched.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    NEXTAUTH_URL="http://localhost:3000" \
    NEXTAUTH_SECRET="build-time-placeholder-unused-at-runtime" \
    INTERNAL_API_SECRET="build-time-placeholder-unused-at-runtime"
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@chiklati/web...

FROM base AS runner
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs webuser
# No apps/web/public directory exists in this app (no static assets checked in).
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
# Next's standalone output-file-tracer does not follow pnpm workspace
# symlinks for *local* packages (confirmed empirically -- @prisma/client,
# a real npm dep, traces fine; these two do not), so copy them in by hand.
COPY --from=installer /app/packages/db/package.json ./node_modules/@chiklati/db/package.json
COPY --from=installer /app/packages/db/dist ./node_modules/@chiklati/db/dist
COPY --from=installer /app/packages/shared/package.json ./node_modules/@chiklati/shared/package.json
COPY --from=installer /app/packages/shared/dist ./node_modules/@chiklati/shared/dist
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
USER webuser
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
