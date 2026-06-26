insert into public.profiles (id, email, nickname, provider, avatar_url)
select
  users.id,
  users.email,
  coalesce(
    users.raw_user_meta_data ->> 'nickname',
    users.raw_user_meta_data ->> 'name',
    split_part(coalesce(users.email, ''), '@', 1)
  ) as nickname,
  coalesce(users.raw_app_meta_data ->> 'provider', 'email') as provider,
  users.raw_user_meta_data ->> 'avatar_url' as avatar_url
from auth.users
left join public.profiles on profiles.id = users.id
where profiles.id is null;

create or replace function public.ensure_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  auth_user auth.users%rowtype;
  profile_row public.profiles%rowtype;
begin
  select *
  into auth_user
  from auth.users
  where id = auth.uid();

  if auth_user.id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, email, nickname, provider, avatar_url)
  values (
    auth_user.id,
    auth_user.email,
    coalesce(
      auth_user.raw_user_meta_data ->> 'nickname',
      auth_user.raw_user_meta_data ->> 'name',
      split_part(coalesce(auth_user.email, ''), '@', 1)
    ),
    coalesce(auth_user.raw_app_meta_data ->> 'provider', 'email'),
    auth_user.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    nickname = coalesce(public.profiles.nickname, excluded.nickname),
    provider = excluded.provider,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now()
  returning * into profile_row;

  return profile_row;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;
