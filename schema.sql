-- Time Tracker V2 — Local PostgreSQL schema
-- Apply with: psql -d time_tracker -f schema.sql
-- Requires PostgreSQL 13+ (uses the built-in gen_random_uuid()).
-- Single-user app: no auth, no row-level security, no user_id scoping.

-- Folders table
create table folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6366f1',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Tasks table
create table tasks (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references folders(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subtasks table
create table subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Time entries table
create table time_entries (
  id uuid primary key default gen_random_uuid(),
  subtask_id uuid not null references subtasks(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

-- Auto-update updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();

create trigger subtasks_updated_at
  before update on subtasks
  for each row
  execute function update_updated_at_column();

-- Indexes for performance
create index idx_tasks_folder_id on tasks(folder_id);
create index idx_subtasks_task_id on subtasks(task_id);
create index idx_time_entries_subtask_id on time_entries(subtask_id);
create index idx_time_entries_started_at on time_entries(started_at);
