# Production Cloudflare Post-Deploy Checklist

Use this after Sagittarius is deployed but public smoke checks cannot reach the
app.

## Current Production Hostname

Canonical hostname: `sagittarius.13thx.com`.

Keep `NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=https://sagittarius.13thx.com` in
the runtime `.env.production`.

## Cloudflare DNS

In Cloudflare Dashboard:

1. Open `13thx.com`.
2. Go to `DNS` -> `Records`.
3. Add or verify these proxied records:

```text
Type: CNAME
Name: sagittarius
Target: <your-cloudflare-tunnel-hostname>.cfargotunnel.com
Proxy status: Proxied
```

If the tunnel was created from the Zero Trust dashboard, Cloudflare may create
these CNAME records automatically when the public hostname is added to the
tunnel. The important check is that `dig +short sagittarius.13thx.com` returns
Cloudflare records.

## Cloudflare Tunnel Public Hostnames

In Cloudflare Dashboard:

1. Go to `Zero Trust` -> `Networks` -> `Tunnels`.
2. Open the tunnel used by the `cloudflared` container.
3. Go to `Public Hostnames`.
4. Add or verify:

```text
Hostname: sagittarius.13thx.com
Service: http://sagittarius-frontend:5180
```

The `sagittarius-frontend` alias intentionally points to the shared
`caddy-gateway`, which routes Sagittarius traffic to the app/API services.

## Cloudflare Access

For private pre-launch deploys, it is okay for the app to redirect to
Cloudflare Access. For public launch or unauthenticated smoke checks, choose one
of these:

### Option A: Public App

1. Go to `Zero Trust` -> `Access` -> `Applications`.
2. Open the application protecting `sagittarius.13thx.com`.
3. Remove the hostname from the protected application, or change the policy so
   public users can reach the app.
4. Re-test:

```bash
curl -sS https://sagittarius.13thx.com/api/v1/health
curl -sS https://sagittarius.13thx.com/api/v1/readiness
```

### Option B: Keep Access, Add Smoke Path Or Service Token

Use this if production should stay private.

1. Keep Access on the app.
2. Add a Service Auth policy for automation, or create a bypass policy for only
   these paths:

```text
/api/v1/health
/api/v1/readiness
```

3. Store the Access service token outside git.
4. Re-test with headers:

```bash
curl -sS \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  https://sagittarius.13thx.com/api/v1/health
```

## Post-Change Smoke

Run these after DNS and Access are updated:

```bash
dig +short sagittarius.13thx.com
curl -sS -D - https://sagittarius.13thx.com/api/v1/health
curl -sS -D - https://sagittarius.13thx.com/api/v1/readiness
```

Expected:

- The canonical frontend returns `200` or an intentional app redirect, not DNS
  failure.
- Health and readiness return API responses, or return through Access only when
  the smoke command includes a valid Access service token.
