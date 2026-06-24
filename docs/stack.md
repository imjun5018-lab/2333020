# Saju Platform Stack

## Frontend

- Framework: Next.js
- Hosting/Deployment: Vercel
- Responsibilities:
  - User-facing saju platform UI
  - Supabase auth client integration
  - Supabase Storage image upload/display flows
  - API calls to backend or Next.js server routes as needed

## Backend

- Runtime: Node.js
- Initial purpose: test/development backend
- Responsibilities:
  - Server-side API endpoints
  - OpenAI API calls using server-side API key only
  - Supabase service-level operations when needed
  - Business logic that should not run in the browser

## Supabase

- Database: Supabase Postgres
- Auth:
  - Email/password signup and login
  - Kakao social login
- Storage:
  - Supabase Storage bucket for images

## AI

- Provider: OpenAI API
- Key handling:
  - Store the OpenAI API key only in backend/server environment variables
  - Never expose the OpenAI API key to frontend browser code

## Deployment Direction

- Frontend deploys to Vercel.
- Backend can start as a local Node test server, then move to a hosted Node environment or serverless API route depending on product needs.
- Supabase provides shared database, auth, and image storage across environments.

