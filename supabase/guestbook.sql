-- Execute uma vez no SQL Editor do seu projeto Supabase.
begin;

create table if not exists public.guestbook_entries (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 32 and name = btrim(name) and name !~ '[[:cntrl:]]'),
  created_at timestamptz not null default now()
);
create index if not exists guestbook_entries_created_at_idx
  on public.guestbook_entries (created_at desc, id desc);
create index if not exists guestbook_entries_name_idx
  on public.guestbook_entries (lower(name), created_at desc);

alter table public.guestbook_entries enable row level security;
-- Sem acesso direto: somente as operações limitadas abaixo ficam públicas.
revoke all on public.guestbook_entries from public, anon, authenticated;
revoke all on sequence public.guestbook_entries_id_seq from public, anon, authenticated;

create or replace function public.guestbook_list()
returns table (name text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select e.name, e.created_at from public.guestbook_entries e
  order by e.created_at desc, e.id desc limit 3;
$$;

create or replace function public.guestbook_sign(visitor_name text)
returns table (name text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  clean_name text := btrim(visitor_name);
begin
  if clean_name is null or char_length(clean_name) not between 1 and 32
    or clean_name ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'Invalid visitor name';
  end if;
  -- Serializa envios para que requisições simultâneas respeitem os limites.
  perform pg_advisory_xact_lock(718254910);
  if (select count(*) from public.guestbook_entries e where e.created_at > now() - interval '1 minute') >= 10
    or exists (select 1 from public.guestbook_entries e
      where lower(e.name) = lower(clean_name) and e.created_at > now() - interval '24 hours') then
    raise exception using errcode = 'PT429', message = 'Please try again later';
  end if;
  insert into public.guestbook_entries (name) values (clean_name);
  return query select * from public.guestbook_list();
end;
$$;

revoke all on function public.guestbook_list() from public, anon, authenticated;
revoke all on function public.guestbook_sign(text) from public, anon, authenticated;
grant execute on function public.guestbook_list() to anon, authenticated;
grant execute on function public.guestbook_sign(text) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
