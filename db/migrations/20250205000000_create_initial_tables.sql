-- migrate:up
create or replace function updated_at() returns trigger
language plpgsql
as
$$
begin
    NEW.updated_at = CURRENT_TIMESTAMP;
    return NEW;
end;
$$;

create schema main;

create table main.user (
    uuid uuid primary key default gen_random_uuid(),
    created_at timestamp not null default CURRENT_TIMESTAMP,
    updated_at timestamp not null default CURRENT_TIMESTAMP,
    wallet_address text unique not null,
    last_active timestamp not null default CURRENT_TIMESTAMP,
    login_message text not null default '',
    login_signature text not null default ''
);

create trigger updated_at
before update on main.user
for each row execute procedure updated_at();

create table main.dashboard (
    uuid uuid primary key default gen_random_uuid(),
    created_at timestamp not null default CURRENT_TIMESTAMP,
    updated_at timestamp not null default CURRENT_TIMESTAMP,
    owner_uuid uuid not null references main.user,
    name text not null,
    stars_count integer not null default 0,
    visibility varchar(7) not null check (visibility in ('private', 'public')),
    execution_count integer not null default 0,
    unique(owner_uuid, name)
);

create trigger updated_at
before update on main.dashboard
for each row execute procedure updated_at();

create table main.user_stars (
    uuid uuid primary key default gen_random_uuid(),
    created_at timestamp not null default CURRENT_TIMESTAMP,
    updated_at timestamp not null default CURRENT_TIMESTAMP,
    user_uuid uuid not null references main.user,
    dashboard_uuid uuid not null references main.dashboard,
    unique(user_uuid, dashboard_uuid)
);

create trigger updated_at
before update on main.user_stars
for each row execute procedure updated_at();

create table main.execution (
    uuid uuid primary key default gen_random_uuid(),
    created_at timestamp not null default CURRENT_TIMESTAMP,
    updated_at timestamp not null default CURRENT_TIMESTAMP,
    user_uuid uuid not null references main.user,
    dashboard_uuid uuid not null references main.dashboard,
    blockchain text not null,
    signed_data_payload jsonb not null,
    gas_used numeric not null default 0,
    status varchar(9) not null check (status in ('pending', 'completed', 'failed'))
);

create trigger updated_at
before update on main.execution
for each row execute procedure updated_at();

create index idx_dashboard_owner on main.dashboard(owner_uuid);
create index idx_dashboard_visibility on main.dashboard(visibility);

-- migrate:down
drop schema if exists main cascade;
drop function if exists updated_at() cascade;
