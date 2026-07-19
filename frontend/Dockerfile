FROM oven/bun:1.3.14-debian AS deps

WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS builder

ARG NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=""
ENV NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=$NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL

WORKDIR /app/frontend
COPY frontend ./
RUN bun run build

FROM oven/bun:1.3.14-debian AS runtime

ARG NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=""
ARG SAGITTARIUS_INTERNAL_API_BASE_URL=""
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=5180
ENV NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=$NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL
ENV SAGITTARIUS_INTERNAL_API_BASE_URL=$SAGITTARIUS_INTERNAL_API_BASE_URL

WORKDIR /app/frontend
COPY --chown=bun:bun --from=builder /app/frontend/package.json /app/frontend/bun.lock ./
COPY --chown=bun:bun --from=builder /app/frontend/node_modules ./node_modules
COPY --chown=bun:bun --from=builder /app/frontend/.next ./.next
COPY --chown=bun:bun --from=builder /app/frontend/public ./public
COPY --chown=bun:bun --from=builder /app/frontend/next.config.ts ./next.config.ts

USER bun
EXPOSE 5180

CMD ["bun", "run", "start"]
