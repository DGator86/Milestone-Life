-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── GROUPS ────────────────────────────────────────────────────────────────────
create table if not exists groups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table groups enable row level security;

create policy "users_own_groups" on groups
  for all using (auth.uid() = user_id);

-- ─── GOALS ─────────────────────────────────────────────────────────────────────
create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  group_id    uuid not null references groups(id) on delete cascade,
  title       text not null,
  goal_type   text not null default 'concrete' check (goal_type in ('concrete','touches','deadline','maintenance')),
  importance  text not null default 'normal'   check (importance in ('normal','important','critical')),
  status      text not null default 'active'   check (status in ('active','archived','completed')),
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table goals enable row level security;

create policy "users_own_goals" on goals
  for all using (auth.uid() = user_id);

-- ─── MILESTONES ────────────────────────────────────────────────────────────────
create table if not exists milestones (
  id           uuid primary key default gen_random_uuid(),
  goal_id      uuid not null references goals(id) on delete cascade,
  title        text not null,
  position     integer not null default 0,
  status       text not null default 'upcoming' check (status in ('upcoming','in_progress','waiting','completed','stuck')),
  due_date     date,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table milestones enable row level security;

create policy "users_own_milestones" on milestones
  for all using (
    exists (
      select 1 from goals g where g.id = goal_id and g.user_id = auth.uid()
    )
  );

-- ─── ACTIVITY LOG ──────────────────────────────────────────────────────────────
create table if not exists activity_log (
  id           uuid primary key default gen_random_uuid(),
  goal_id      uuid not null references goals(id) on delete cascade,
  milestone_id uuid references milestones(id) on delete set null,
  action       text not null,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

alter table activity_log enable row level security;

create policy "users_own_activity" on activity_log
  for all using (
    exists (
      select 1 from goals g where g.id = goal_id and g.user_id = auth.uid()
    )
  );

-- ─── UPDATED_AT TRIGGER ────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger goals_updated_at
  before update on goals
  for each row execute function set_updated_at();

create or replace trigger milestones_updated_at
  before update on milestones
  for each row execute function set_updated_at();

-- ─── DEFAULT GROUPS FUNCTION ───────────────────────────────────────────────────
-- ─── CRM TABLES ────────────────────────────────────────────────────────────────

create table if not exists crm_customers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  industry    text,
  website     text,
  phone       text,
  email       text,
  status      text not null default 'prospect' check (status in ('prospect', 'active', 'inactive')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table crm_customers enable row level security;
create policy "users_own_crm_customers" on crm_customers
  for all using (auth.uid() = user_id);

create table if not exists crm_flows (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  color       text not null default '#1769FF',
  stages      jsonb not null default '["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table crm_flows enable row level security;
create policy "users_own_crm_flows" on crm_flows
  for all using (auth.uid() = user_id);

create table if not exists crm_contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references crm_customers(id) on delete set null,
  first_name  text not null,
  last_name   text not null,
  email       text,
  phone       text,
  title       text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table crm_contacts enable row level security;
create policy "users_own_crm_contacts" on crm_contacts
  for all using (auth.uid() = user_id);

create table if not exists crm_opportunities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references crm_customers(id) on delete set null,
  contact_id  uuid references crm_contacts(id) on delete set null,
  flow_id     uuid references crm_flows(id) on delete set null,
  title       text not null,
  value       numeric(12,2),
  stage       text not null default 'Lead',
  status      text not null default 'open' check (status in ('open', 'won', 'lost')),
  close_date  date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table crm_opportunities enable row level security;
create policy "users_own_crm_opportunities" on crm_opportunities
  for all using (auth.uid() = user_id);

create or replace trigger crm_customers_updated_at
  before update on crm_customers
  for each row execute function set_updated_at();

create or replace trigger crm_contacts_updated_at
  before update on crm_contacts
  for each row execute function set_updated_at();

create or replace trigger crm_flows_updated_at
  before update on crm_flows
  for each row execute function set_updated_at();

create or replace trigger crm_opportunities_updated_at
  before update on crm_opportunities
  for each row execute function set_updated_at();

-- Cross-tenant reference guards
create or replace function check_crm_contact_tenant()
returns trigger language plpgsql as $$
begin
  if new.customer_id is not null then
    if not exists (
      select 1 from crm_customers where id = new.customer_id and user_id = new.user_id
    ) then
      raise exception 'customer_id must belong to the same user';
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger crm_contacts_tenant_check
  before insert or update on crm_contacts
  for each row execute function check_crm_contact_tenant();

create or replace function check_crm_opportunity_tenant()
returns trigger language plpgsql as $$
begin
  if new.customer_id is not null then
    if not exists (
      select 1 from crm_customers where id = new.customer_id and user_id = new.user_id
    ) then
      raise exception 'customer_id must belong to the same user';
    end if;
  end if;
  if new.contact_id is not null then
    if not exists (
      select 1 from crm_contacts where id = new.contact_id and user_id = new.user_id
    ) then
      raise exception 'contact_id must belong to the same user';
    end if;
  end if;
  if new.flow_id is not null then
    if not exists (
      select 1 from crm_flows where id = new.flow_id and user_id = new.user_id
    ) then
      raise exception 'flow_id must belong to the same user';
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger crm_opportunities_tenant_check
  before insert or update on crm_opportunities
  for each row execute function check_crm_opportunity_tenant();

-- ─── CRM TASKS (Kill List) ─────────────────────────────────────────────────────

create table if not exists crm_tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  customer_id    uuid references crm_customers(id) on delete set null,
  contact_id     uuid references crm_contacts(id) on delete set null,
  opportunity_id uuid references crm_opportunities(id) on delete set null,
  title          text not null,
  type           text not null default 'task' check (type in ('call','email','meeting','task','document')),
  priority       text not null default 'medium' check (priority in ('critical','high','medium','low')),
  due_date       date,
  done           boolean not null default false,
  completed_at   timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table crm_tasks enable row level security;
create policy "users_own_crm_tasks" on crm_tasks
  for all using (auth.uid() = user_id);

create or replace trigger crm_tasks_updated_at
  before update on crm_tasks
  for each row execute function set_updated_at();

create or replace function check_crm_task_tenant()
returns trigger language plpgsql as $$
begin
  if new.customer_id is not null then
    if not exists (select 1 from crm_customers where id = new.customer_id and user_id = new.user_id) then
      raise exception 'customer_id must belong to the same user';
    end if;
  end if;
  if new.contact_id is not null then
    if not exists (select 1 from crm_contacts where id = new.contact_id and user_id = new.user_id) then
      raise exception 'contact_id must belong to the same user';
    end if;
  end if;
  if new.opportunity_id is not null then
    if not exists (select 1 from crm_opportunities where id = new.opportunity_id and user_id = new.user_id) then
      raise exception 'opportunity_id must belong to the same user';
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger crm_tasks_tenant_check
  before insert or update on crm_tasks
  for each row execute function check_crm_task_tenant();

create index if not exists crm_tasks_user_due_idx on crm_tasks(user_id, due_date);

create index if not exists crm_contacts_customer_idx on crm_contacts(customer_id);
create index if not exists crm_contacts_user_idx on crm_contacts(user_id);
create index if not exists crm_opportunities_customer_idx on crm_opportunities(customer_id);
create index if not exists crm_opportunities_contact_idx on crm_opportunities(contact_id);
create index if not exists crm_opportunities_flow_idx on crm_opportunities(flow_id);
create index if not exists crm_opportunities_user_idx on crm_opportunities(user_id);
create index if not exists crm_tasks_customer_idx on crm_tasks(customer_id);
create index if not exists crm_tasks_contact_idx on crm_tasks(contact_id);
create index if not exists crm_tasks_opportunity_idx on crm_tasks(opportunity_id);
create index if not exists crm_tasks_user_idx on crm_tasks(user_id);

-- Star / pin goals on the home page
alter table goals add column if not exists pinned boolean not null default false;

-- ─── DEFAULT GROUPS / HELPERS ──────────────────────────────────────────────────

create or replace function ensure_default_groups()
returns void language plpgsql security definer as $$
begin
  if not exists (select 1 from groups where user_id = auth.uid()) then
    insert into groups (user_id, name, color, sort_order) values
      (auth.uid(), 'Work',   '#1769FF', 0),
      (auth.uid(), 'Home',   '#36A852', 1),
      (auth.uid(), 'Health', '#F8B400', 2);
  end if;
end;
$$;
