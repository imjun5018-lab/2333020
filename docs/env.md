# Environment Variables

## Frontend

Use these in the Next.js app.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Only `NEXT_PUBLIC_*` values are safe for browser exposure. Do not put server secrets here.

## Backend

Use these only on the Node backend, server-side routes, or Supabase Edge Functions.

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=
OPENAI_API_KEY=
OPENAI_MODEL=
```

`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, and `OPENAI_API_KEY` must stay server-side.
`SUPABASE_ACCESS_TOKEN` is only for Supabase CLI deployment commands, not browser or function runtime code.

## Supabase Edge Functions

The Express backend endpoints have Supabase Function equivalents:

```text
GET  /functions/v1/health
POST /functions/v1/readings-test
POST /functions/v1/readings-ai
POST /functions/v1/tarot-generate
POST /functions/v1/fortune-generate
POST /functions/v1/storage-test-image-record
```

Set these function secrets before deployment:

```bash
supabase secrets set OPENAI_API_KEY=... OPENAI_MODEL=gpt-4.1-mini FRONTEND_ORIGIN=http://localhost:3000
```

If the token is stored in `backend/.env`, load it in PowerShell before running Supabase CLI commands:

```powershell
$env:SUPABASE_ACCESS_TOKEN = (Select-String -Path backend\.env -Pattern '^SUPABASE_ACCESS_TOKEN=').Line.Split('=', 2)[1]
```

## Supabase Auth Providers

Required Supabase configuration:

- Enable email/password authentication.
- Enable Kakao OAuth provider.
- Configure Kakao redirect URL for local development and Vercel production.

## Supabase Storage

Recommended initial bucket:

```text
images
```

Bucket policy should be decided by feature:

- Public read if images are meant to be visible to everyone.
- Private bucket with signed URLs if images are user-private.
