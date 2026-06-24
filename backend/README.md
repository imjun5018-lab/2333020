# Backend

This is a temporary Node.js test server for local development.

## Run

```bash
npm install
npm run dev
```

Default URL:

```text
http://127.0.0.1:4000
```

Health check:

```text
GET /health
```

## Test Endpoints

```text
POST /api/readings/test
POST /api/readings/ai
POST /api/storage/test-image-record
```

## Production Direction

This backend is only for testing. Final production behavior should move to Supabase-first architecture:

- Supabase Auth for email/password and Kakao login
- Supabase Postgres for user profiles, readings, and image records
- Supabase Storage bucket for images
- Server-side OpenAI calls through a secure server route, edge function, or protected backend

Never expose `OPENAI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to browser code.

