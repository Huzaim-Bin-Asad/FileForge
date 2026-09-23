# Deploying to Vercel

Everything here already runs as serverless functions — every route under
`app/api/**` is a Next.js Route Handler with `export const runtime = "nodejs"`,
and the Postgres client (`@neondatabase/serverless` over HTTP) has no
persistent connections, so it works from a cold serverless invocation with no
extra setup. There's no separate "backend" to stand up.

## 1. Repo is a monorepo — set the Root Directory

This app lives at `apps/web` inside a pnpm/Turborepo workspace. In the Vercel
project settings:

- **Root Directory**: `apps/web`
- **Framework Preset**: Next.js (auto-detected)
- Leave Build/Install commands on their defaults — Vercel runs `pnpm install`
  from the workspace root automatically once Root Directory is set.

## 2. Database (Neon)

1. Create a Neon Postgres project (or reuse an existing one).
2. Run migrations against it before (or right after) the first deploy:
   ```
   DATABASE_URL="<neon-connection-string>" pnpm db:migrate
   ```
   Run this from your machine or CI, not as part of the Vercel build — you
   don't want migrations racing across concurrent build/runtime invocations.
3. Use the **pooled** connection string Neon gives you (the one with
   `-pooler` in the hostname) for `DATABASE_URL` — serverless functions open
   a lot of short-lived connections.

## 3. Environment variables

Set these in Vercel → Project → Settings → Environment Variables (see
`.env.example` for the full list with descriptions):

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `JWT_ACCESS_SECRET` | Yes | `openssl rand -base64 32` |
| `TOKEN_PEPPER` | Yes | `openssl rand -base64 32`, different from the above |
| `APP_URL` | Yes | Your production URL, e.g. `https://fileforge.vercel.app` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Only if Google sign-in is enabled | See step 4 |
| `BLOB_READ_WRITE_TOKEN` | Yes (for file storage) | Vercel Blob → create a **private** store and connect it to the project; Vercel injects this. Server-only. Without it, new conversions fall back to Postgres bytea |
| `RESEND_API_KEY` | Recommended | Without it, password-reset links only appear in function logs |
| `EMAIL_FROM` | Recommended | Must be on a domain verified in Resend |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional | Rate-limits login/signup/forgot-password; silently skipped if unset |

## 4. Google OAuth redirect URI

If Google sign-in is enabled, add this to the OAuth client's **Authorized
redirect URIs** in Google Cloud Console:

```
{APP_URL}/api/auth/google/callback
```

using your real `APP_URL` (both the preview and production domains if you
test on preview deployments).

## 5. Upload size limit

Vercel serverless functions hard-cap request bodies at **4.5 MB** — this is
a platform limit, not something raised via config. The converter enforces a
4 MB limit client- and server-side (`lib/uploadLimits.ts`) so oversized
files fail with a clear message instead of a raw platform 413.

## 6. Conversion function timeout

`app/api/convert/route.ts` sets `export const maxDuration = 60` (mirrored in
`vercel.json`). 60s works on Hobby; if conversions of large files are timing
out, Pro plans can raise this to 300s. This route (the session-authenticated
web UI) still runs conversions synchronously — see the next section for the
route that doesn't.

## 7. Asynchronous API conversions (Vercel Queues)

`POST /api/v1/convert` is asynchronous: it durably stores the upload and
schedules a job, then `app/api/queues/process-conversion/route.ts` — a
private function Vercel invokes directly, never reachable over the internet
— does the actual conversion. This needs **Vercel Queues** enabled on the
project:

- Vercel dashboard → the project → check that Queues is available (the
  `queue/v2beta` trigger in `vercel.json` is what wires the consumer up;
  no separate topic-creation step is needed, the first `send()` creates it).
- No new environment variable: `@vercel/queue` authenticates via Vercel's
  own OIDC, provisioned automatically on deploy, the same as other
  Vercel-managed integrations.
- The consumer's `maxDuration` (300s, in `app/api/queues/process-conversion/route.ts`)
  is the ceiling for one conversion attempt. See the Phase 4 report for
  which converters can realistically approach that on Hobby, and why very
  large files may need Pro's higher duration limit.
- `reclaimStaleJobs` (`lib/jobProcessor.ts`) recovers a job stuck
  "processing" if its queue message is ever lost outright — it isn't wired
  to a cron job yet; see the Phase 4 report before deciding whether/how to
  schedule it.

## Post-deploy checklist

- [ ] Migrations applied to the production database
- [ ] All required env vars set for the Production (and Preview, if used) environment
- [ ] Google OAuth redirect URI updated with the real domain
- [ ] Resend sender domain verified (or accept reset links only reaching logs)
- [ ] Vercel Queues enabled on the project (see §7)
- [ ] Sign up, log in, convert a file, and request a password reset once against the deployed URL
- [ ] `POST /api/v1/convert` with an API key returns 202, and `GET /api/v1/jobs/:id` reaches "completed"
