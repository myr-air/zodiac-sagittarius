FROM rust:1.95-bookworm AS builder

WORKDIR /app
COPY backend/Cargo.toml backend/Cargo.lock ./backend/
COPY backend/crates ./backend/crates
COPY backend/migrations ./backend/migrations
WORKDIR /app/backend
RUN cargo build --release --bin sagittarius-api

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /usr/sbin/nologin sagittarius
USER sagittarius
WORKDIR /app

COPY --from=builder /app/backend/target/release/sagittarius-api /usr/local/bin/sagittarius-api

ENV SAGITTARIUS_BIND_ADDR=0.0.0.0:5181
EXPOSE 5181

CMD ["sagittarius-api"]
