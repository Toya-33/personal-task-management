-- Time Tracker V2 - Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Folders table
create table folders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#6366f1',
  sort_order integer not null default 0,
  created_at timestamptz default now() not null
);

alter table folders enable row level security;
create policy "Users can manage their own folders" on folders
  for all using (auth.uid() = user_id);

-- Tasks table
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  folder_id uuid references folders(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  sort_order integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table tasks enable row level security;
create policy "Users can manage their own tasks" on tasks
  for all using (auth.uid() = user_id);

-- Subtasks table
create table subtasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete cascade not null,
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  sort_order integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table subtasks enable row level security;
create policy "Users can manage their own subtasks" on subtasks
  for all using (auth.uid() = user_id);

-- Time entries table
create table time_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subtask_id uuid references subtasks(id) on delete cascade not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz default now() not null
);

alter table time_entries enable row level security;
create policy "Users can manage their own time entries" on time_entries
  for all using (auth.uid() = user_id);

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
create index idx_folders_user_id on folders(user_id);
create index idx_tasks_user_id on tasks(user_id);
create index idx_tasks_folder_id on tasks(folder_id);
create index idx_subtasks_user_id on subtasks(user_id);
create index idx_subtasks_task_id on subtasks(task_id);
create index idx_time_entries_user_id on time_entries(user_id);
create index idx_time_entries_subtask_id on time_entries(subtask_id);
create index idx_time_entries_started_at on time_entries(started_at);
