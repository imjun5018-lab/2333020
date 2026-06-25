# Vercel Deployment

## Project Settings

When importing this repository into Vercel, set:

```text
Framework Preset: Next.js
Root Directory: frontend
Install Command: npm ci
Build Command: npm run build
Output Directory: .next
```

## Environment Variables

Add these in Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yatqauonguxjrprcsfyx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be used instead of `NEXT_PUBLIC_SUPABASE_ANON_KEY` when using Supabase publishable keys.

Do not add `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SUPABASE_ACCESS_TOKEN` to Vercel frontend environment variables. Those stay in Supabase Function secrets or local CLI-only env files.

## Supabase Function CORS

Supabase Functions support comma-separated frontend origins through `FRONTEND_ORIGINS`:

```bash
supabase secrets set FRONTEND_ORIGINS=https://your-vercel-domain.vercel.app,http://localhost:3000
```

If no origin is configured, the functions allow all origins.
