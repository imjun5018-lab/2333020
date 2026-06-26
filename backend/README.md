# Backend

This is a temporary Node.js test server for local development.

## Run

```bash
npm install
npm run dev
```

Default port:

```text
4000
```

Health check:

```text
GET /health
```

## Environment

Create `backend/.env` and add your Supabase values:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

For local read-only testing, `SUPABASE_ANON_KEY` or `SUPABASE_KEY` can also be used. Use `SUPABASE_SERVICE_ROLE_KEY` for server-side insert routes like `/api/storage/test-image-record`.

## Test Endpoints

```text
POST /api/readings/test
POST /api/readings/ai
POST /api/storage/test-image-record
```

Supabase Edge Function replacements:

```text
GET  /functions/v1/health
POST /functions/v1/readings-test
POST /functions/v1/readings-ai
POST /functions/v1/storage-test-image-record
```

## Production Direction

This backend is only for testing. Final production behavior should move to Supabase-first architecture:

- Supabase Auth for email/password and Kakao login
- Supabase Postgres for user profiles, readings, and image records
- Supabase Storage bucket for images
- Server-side OpenAI calls through a secure server route, edge function, or protected backend

Never expose `OPENAI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to browser code.
