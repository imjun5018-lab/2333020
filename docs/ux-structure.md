# UX Structure

## Source References

- `docs/stack.md`: frontend, backend, Supabase, OpenAI role split
- `docs/env.md`: public frontend variables and server-only secrets
- `screenshot/`: reference screenshots folder

Current note: `screenshot/` is empty, so the first structured UI pass uses the documented stack and generated visual assets.

## Primary Screens

1. Home hero
   - Product positioning
   - Main calls to action
   - Stack confidence cues

2. Service list
   - Today's fortune
   - Traditional saju
   - Compatibility
   - Career
   - Money
   - Health balance

3. Reading flow
   - Login
   - Birth information input
   - Topic selection
   - AI report generation
   - Image/report storage

4. Feature structure
   - Supabase Auth
   - OpenAI report generation
   - Supabase Storage bucket
   - Next.js/Vercel and Node test backend architecture

5. Personal archive
   - Recent reports
   - Saved images
   - Consultation notes

6. Auth entry
   - Email signup
   - Kakao social login

## Media Assets

Generated assets are stored in:

```text
media/generated
frontend/public/media
```

The project keeps root `media/generated` as the source asset folder and uses `frontend/public/media` for browser delivery.

