# Environment Variables

## Frontend

Use these in the Next.js app.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Only `NEXT_PUBLIC_*` values are safe for browser exposure. Do not put server secrets here.

## Backend

Use these only on the Node backend or server-side routes.

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` must stay server-side.

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

