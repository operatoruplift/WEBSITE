-- Operator Uplift Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text default 'Commander',
  email text,
  avatar_url text,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', 'Commander'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- AGENTS
-- ============================================
create table if not exists public.agents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  template text,
  model text not null default 'claude-sonnet-4-6',
  system_prompt text,
  status text default 'idle' check (status in ('running', 'idle', 'error', 'stopped')),
  is_favorite boolean default false,
  source text default 'builder' check (source in ('builder', 'marketplace')),
  config jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.agents enable row level security;
create policy "Users manage own agents" on public.agents for all using (auth.uid() = user_id);
create index if not exists idx_agents_user on public.agents(user_id);

-- ============================================
-- CHAT SESSIONS
-- ============================================
create table if not exists public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  title text default 'New Chat',
  model text not null default 'claude-sonnet-4-6',
  message_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.chat_sessions enable row level security;
create policy "Users manage own sessions" on public.chat_sessions for all using (auth.uid() = user_id);
create index if not exists idx_sessions_user on public.chat_sessions(user_id, created_at desc);

-- ============================================
-- MESSAGES
-- ============================================
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  model text,
  token_count integer,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;
create policy "Users manage own messages" on public.messages for all using (auth.uid() = user_id);
create index if not exists idx_messages_session on public.messages(session_id, created_at asc);

-- ============================================
-- MEMORY NODES
-- ============================================
create table if not exists public.memory_nodes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('document', 'code', 'url', 'note')),
  source text default 'Manual entry',
  content text,
  tags text[] default '{}',
  size_bytes integer default 0,
  chunk_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.memory_nodes enable row level security;
create policy "Users manage own memory" on public.memory_nodes for all using (auth.uid() = user_id);
create index if not exists idx_memory_user on public.memory_nodes(user_id);

-- ============================================
-- MEMORY CHUNKS (for RAG)
-- ============================================
create table if not exists public.memory_chunks (
  id uuid primary key default uuid_generate_v4(),
  node_id uuid not null references public.memory_nodes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  created_at timestamptz default now()
);

alter table public.memory_chunks enable row level security;
create policy "Users manage own chunks" on public.memory_chunks for all using (auth.uid() = user_id);
create index if not exists idx_chunks_node on public.memory_chunks(node_id, chunk_index);

-- ============================================
-- ANALYTICS EVENTS
-- ============================================
create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.analytics_events enable row level security;
create policy "Users read own events" on public.analytics_events for select using (auth.uid() = user_id);
create policy "Users insert own events" on public.analytics_events for insert with check (auth.uid() = user_id);
create index if not exists idx_events_user_time on public.analytics_events(user_id, created_at desc);

-- ============================================
-- Done! Run this in Supabase SQL Editor.
-- ============================================
