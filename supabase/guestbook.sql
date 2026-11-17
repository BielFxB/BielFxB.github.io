-- Execute no SQL Editor do seu projeto Supabase, inclusive para atualizar a versão anterior.
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

-- Compatível com o banco existente: assinaturas antigas continuam públicas,
-- mas não podem ser reivindicadas por nome, pois não tinham identificação.
alter table public.guestbook_entries add column if not exists owner_hash text;
create unique index if not exists guestbook_entries_owner_idx
  on public.guestbook_entries (owner_hash);

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

-- Remove a versão antiga para impedir envios sem identificação.
drop function if exists public.guestbook_sign(text);

create or replace function public.guestbook_mine(visitor_token text)
returns table (name text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if visitor_token is null or visitor_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'Invalid visitor token';
  end if;
  return query select e.name, e.created_at from public.guestbook_entries e
    where e.owner_hash = encode(sha256(convert_to(visitor_token, 'UTF8')), 'hex');
end;
$$;

create or replace function public.guestbook_sign(visitor_name text, visitor_token text)
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
  if visitor_token is null or visitor_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'Invalid visitor token';
  end if;
  -- Serializa envios para que requisições simultâneas respeitem os limites.
  perform pg_advisory_xact_lock(718254910);
  if exists (select 1 from public.guestbook_entries e
    where e.owner_hash = encode(sha256(convert_to(visitor_token, 'UTF8')), 'hex')) then
    raise exception using errcode = 'PT409', message = 'Delete your current signature first';
  end if;
  if (select count(*) from public.guestbook_entries e where e.created_at > now() - interval '1 minute') >= 10 then
    raise exception using errcode = 'PT429', message = 'Please try again later';
  end if;
  insert into public.guestbook_entries (name, owner_hash)
    values (clean_name, encode(sha256(convert_to(visitor_token, 'UTF8')), 'hex'));
  return query select * from public.guestbook_list();
end;
$$;

create or replace function public.guestbook_delete(visitor_token text)
returns table (name text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if visitor_token is null or visitor_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'Invalid visitor token';
  end if;
  perform pg_advisory_xact_lock(718254910);
  delete from public.guestbook_entries e
    where e.owner_hash = encode(sha256(convert_to(visitor_token, 'UTF8')), 'hex');
  return query select * from public.guestbook_list();
end;
$$;

revoke all on function public.guestbook_list() from public, anon, authenticated;
revoke all on function public.guestbook_mine(text) from public, anon, authenticated;
revoke all on function public.guestbook_sign(text, text) from public, anon, authenticated;
revoke all on function public.guestbook_delete(text) from public, anon, authenticated;
grant execute on function public.guestbook_list() to anon, authenticated;
grant execute on function public.guestbook_mine(text) to anon, authenticated;
grant execute on function public.guestbook_sign(text, text) to anon, authenticated;
grant execute on function public.guestbook_delete(text) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
