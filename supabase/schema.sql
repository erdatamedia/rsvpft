create extension if not exists "uuid-ossp";

create table if not exists admins (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists attendees (
  id text primary key,
  name text not null,
  program text not null,
  phone text not null,
  email text not null default '',
  npm text not null default '-',
  seat text not null default '-'
    check (char_length(seat) <= 10),
  status text not null default 'draft'
    check (status in ('draft','sent','confirmed')),
  whatsapp_sent boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_attendees_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_attendees_updated
  before update on attendees
  for each row execute procedure set_attendees_updated_at();
