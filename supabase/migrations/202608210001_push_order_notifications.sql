-- Cookies Crumbs: Push Notifications for new orders

create extension if not exists pgcrypto;

create table if not exists public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  device_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_push_subscriptions_user_endpoint_key unique (user_id, endpoint)
);

alter table public.admin_push_subscriptions enable row level security;

drop policy if exists "admins can read own push subscriptions" on public.admin_push_subscriptions;
create policy "admins can read own push subscriptions"
on public.admin_push_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "admins can insert own push subscriptions" on public.admin_push_subscriptions;
create policy "admins can insert own push subscriptions"
on public.admin_push_subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "admins can update own push subscriptions" on public.admin_push_subscriptions;
create policy "admins can update own push subscriptions"
on public.admin_push_subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "admins can delete own push subscriptions" on public.admin_push_subscriptions;
create policy "admins can delete own push subscriptions"
on public.admin_push_subscriptions
for delete
to authenticated
using (auth.uid() = user_id);

-- Realtime is used only for the sound/toast while the admin page is open.
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
  when undefined_object then
    raise notice 'supabase_realtime publication is not available; enable Realtime for orders in the Supabase dashboard.';
end $$;

-- Helpful index for the notification lookup.
create index if not exists idx_admin_push_subscriptions_user_id
  on public.admin_push_subscriptions(user_id);
