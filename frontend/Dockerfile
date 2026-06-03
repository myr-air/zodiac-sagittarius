FROM oven/bun:1.3.5-debian AS deps

WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS builder

WORKDIR /app/frontend
COPY frontend ./
RUN bun run build

FROM oven/bun:1.3.5-debian AS runtime

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=5180

WORKDIR /app/frontend
COPY --from=builder /app/frontend/package.json /app/frontend/bun.lock ./
COPY --from=builder /app/frontend/node_modules ./node_modules
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/next.config.ts ./next.config.ts

USER bun
EXPOSE 5180

CMD ["bun", "run", "start"]
