# Production Cloudflare Post-Deploy Checklist

Use this after Sagittarius is deployed but public smoke checks cannot reach the
app.

## Current Production Hostnames

- Primary intended hostname: `joii.13thx.com`
- Active fallback hostname: `sagittarius.13thx.com`

If `joii.13thx.com` does not resolve yet, keep
`NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=https://sagittarius.13thx.com` in the
runtime `.env.production` until the primary DNS record and tunnel route are
working.

## Cloudflare DNS

In Cloudflare Dashboard:

1. Open `13thx.com`.
2. Go to `DNS` -> `Records`.
3. Add or verify these proxied records:

```text
Type: CNAME
Name: joii
Target: <your-cloudflare-tunnel-hostname>.cfargotunnel.com
Proxy status: Proxied

Type: CNAME
Name: sagittarius
Target: <your-cloudflare-tunnel-hostname>.cfargotunnel.com
Proxy status: Proxied
```

If the tunnel was created from the Zero Trust dashboard, Cloudflare may create
these CNAME records automatically when the public hostname is added to the
tunnel. The important check is that `dig +short joii.13thx.com` and
`dig +short sagittarius.13thx.com` return Cloudflare records.

## Cloudflare Tunnel Public Hostnames

In Cloudflare Dashboard:

1. Go to `Zero Trust` -> `Networks` -> `Tunnels`.
2. Open the tunnel used by the `cloudflared` container.
3. Go to `Public Hostnames`.
4. Add or verify:

```text
Hostname: joii.13thx.com
Service: http://sagittarius-web:5180

Hostname: sagittarius.13thx.com
Service: http://sagittarius-web:5180
```

If traffic is routed through the shared Caddy gateway instead of directly to the
Sagittarius frontend container, use this service target instead:

```text
Service: http://caddy-gateway:80
```

The repo Caddy gateway accepts both hostnames and routes them to the
Sagittarius stack.

## Cloudflare Access

For private pre-launch deploys, it is okay for the app to redirect to
Cloudflare Access. For public launch or unauthenticated smoke checks, choose one
of these:

### Option A: Public App

1. Go to `Zero Trust` -> `Access` -> `Applications`.
2. Open the application protecting `sagittarius.13thx.com` / `joii.13thx.com`.
3. Remove the hostname from the protected application, or change the policy so
   public users can reach the app.
4. Re-test:

```bash
curl -I https://joii.13thx.com/
curl -sS https://joii.13thx.com/api/v1/health
curl -sS https://joii.13thx.com/api/v1/readiness
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
  https://joii.13thx.com/api/v1/health
```

## Post-Change Smoke

Run these after DNS and Access are updated:

```bash
dig +short joii.13thx.com
dig +short sagittarius.13thx.com
curl -sS -I https://joii.13thx.com/
curl -sS -D - https://joii.13thx.com/api/v1/health
curl -sS -D - https://joii.13thx.com/api/v1/readiness
```

Expected:

- `joii.13thx.com` resolves.
- The frontend returns `200` or an intentional app redirect, not DNS failure.
- Health and readiness return API responses, or return through Access only when
  the smoke command includes a valid Access service token.
