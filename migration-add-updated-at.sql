-- Migration: Add updated_at column to tasks and subtasks
-- Run this in the Supabase SQL Editor

-- Add updated_at column to tasks
alter table tasks add column updated_at timestamptz default now() not null;

-- Add updated_at column to subtasks
alter table subtasks add column updated_at timestamptz default now() not null;

-- Backfill: set updated_at = created_at for existing rows
update tasks set updated_at = created_at;
update subtasks set updated_at = created_at;

-- Create trigger function to auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach trigger to tasks table
create trigger tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();

-- Attach trigger to subtasks table
create trigger subtasks_updated_at
  before update on subtasks
  for each row
  execute function update_updated_at_column();

-- Indexes for sorting by updated_at
create index idx_tasks_updated_at on tasks(updated_at desc);
create index idx_subtasks_updated_at on subtasks(updated_at desc);
