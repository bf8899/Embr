-- Live per-video chat. Ephemeral-feeling real-time messages (delivered via
-- Supabase Realtime), separate from the persistent threaded comments. handle is
-- denormalized (set by trigger from the sender's profile) so the realtime
-- payload can render a name without a follow-up query.

create table public.chat_messages (
  id bigint generated always as identity primary key,
  video_id uuid not null references public.videos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  handle text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create index chat_messages_video_created_idx on public.chat_messages (video_id, created_at);

alter table public.chat_messages enable row level security;

-- Public read so anonymous viewers can watch the chat scroll in realtime.
create policy "Chat is readable by everyone"
  on public.chat_messages for select
  using (true);

-- Post as yourself; suspension is enforced in the trigger below.
create policy "Users can chat as themselves"
  on public.chat_messages for insert
  with check (user_id = auth.uid());

-- Stamp the handle from the sender's profile (never trusted from the client),
-- block suspended users, and rate-limit to curb spam.
create function public.chat_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_handle text;
begin
  select handle into v_handle from public.profiles
    where id = new.user_id and not suspended;
  if v_handle is null then
    raise exception 'not allowed to chat';
  end if;
  new.handle := v_handle;

  if (select count(*) from public.chat_messages
      where user_id = new.user_id and created_at > now() - interval '8 seconds') >= 10 then
    raise exception 'slow down';
  end if;

  new.body := left(trim(new.body), 500);
  if length(new.body) = 0 then
    raise exception 'empty message';
  end if;

  return new;
end;
$$;

create trigger chat_before_insert
  before insert on public.chat_messages
  for each row execute function public.chat_before_insert();

-- Deliver inserts over Realtime.
alter publication supabase_realtime add table public.chat_messages;
