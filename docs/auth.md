# Supabase Auth

## Implemented

- Email signup and login use Supabase Auth.
- Kakao signup and login use Supabase OAuth with provider `kakao`.
- `public.profiles` is created automatically when a user is created in `auth.users`.

## Email Auth

Remote Supabase settings verified:

```text
external.email = true
disable_signup = false
```

## Kakao Auth

The frontend is wired to:

```ts
supabase.auth.signInWithOAuth({ provider: "kakao" })
```

Supabase currently reports:

```text
external.kakao = false
```

To activate Kakao login, configure the Kakao provider in Supabase Dashboard:

```text
Authentication > Providers > Kakao
```

Add the Kakao REST API key and client secret from Kakao Developers, then add this callback URL in Kakao Developers:

```text
https://yatqauonguxjrprcsfyx.supabase.co/auth/v1/callback
```

After the provider is enabled, the existing login/signup buttons will start the Kakao OAuth flow.
