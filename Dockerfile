# syntax=docker/dockerfile:1.2

##########################################################################
# Stage: deps
##########################################################################
FROM node:22 AS deps
WORKDIR /build-stage
COPY package*.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# advanced mount options for caching pnpm even when docker-cache is busted
RUN --mount=type=cache,target=/usr/src/app/.pnpm \
    : pnpm install and cache \
    && pnpm config set store-dir /usr/src/app/.pnpm \
    && pnpm install --frozen-lockfile

COPY . ./

##########################################################################
# Stage: builder
##########################################################################
FROM deps as builder
RUN pnpm run build

##########################################################################
# Stage: dev
##########################################################################
FROM deps AS dev

ARG PORT=3000
ENV PORT=${PORT}

ENTRYPOINT ["/usr/local/bin/pnpm"]
CMD ["run", "dev"]

##########################################################################
# Stage: test
##########################################################################
FROM deps AS test

ENV CI=1
RUN pnpm run lint

##########################################################################
# Stage: final
##########################################################################

FROM node:22 AS final
WORKDIR /app
COPY --from=builder /build-stage/package*.json /build-stage/pnpm-lock.yaml ./
COPY --from=builder /build-stage/.next ./.next
COPY --from=builder /build-stage/public ./public

# Install pnpm and production dependencies
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

EXPOSE 3000
CMD ["pnpm", "run", "start"]

