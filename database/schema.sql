-- Tool-Tipper Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists pgcrypto;

-- Create tables
create table if not exists page (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  edit_token text unique not null,
  title text,
  image_path text,
  image_width int,
  image_height int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hotspot (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references page(id) on delete cascade,
  x_pct numeric(6,4) not null check (x_pct >= 0 and x_pct <= 1),
  y_pct numeric(6,4) not null check (y_pct >= 0 and y_pct <= 1),
  text text not null,
  z_index int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists hotspot_page_idx on hotspot(page_id);
create index if not exists page_slug_idx on page(slug);
create index if not exists page_edit_token_idx on page(edit_token);

-- Enable Row Level Security
alter table page enable row level security;
alter table hotspot enable row level security;

-- RLS Policies: Allow public reads, allow writes through server functions
create policy "read pages" on page for select using (true);
create policy "read hotspots" on hotspot for select using (true);

-- Allow inserts for new pages (anyone can create)
create policy "insert pages" on page for insert with check (true);

-- Allow updates to pages if edit token matches (will be validated server-side)
create policy "update pages" on page for update using (true);

-- Allow hotspot operations (will be validated server-side via edit token)
create policy "insert hotspots" on hotspot for insert with check (true);
create policy "update hotspots" on hotspot for update using (true);
create policy "delete hotspots" on hotspot for delete using (true);