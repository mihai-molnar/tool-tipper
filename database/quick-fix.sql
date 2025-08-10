-- Quick fix for Tool-Tipper permissions
-- Run this in your Supabase SQL editor

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS hotspot;
DROP TABLE IF EXISTS page;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate tables with correct schema
CREATE TABLE page (
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

CREATE TABLE hotspot (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references page(id) on delete cascade,
  x_pct numeric(6,4) not null check (x_pct >= 0 and x_pct <= 1),
  y_pct numeric(6,4) not null check (y_pct >= 0 and y_pct <= 1),
  text text not null,
  z_index int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
CREATE INDEX hotspot_page_idx ON hotspot(page_id);
CREATE INDEX page_slug_idx ON page(slug);
CREATE INDEX page_edit_token_idx ON page(edit_token);

-- Grant permissions to anonymous role
GRANT ALL ON page TO anon;
GRANT ALL ON hotspot TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Enable RLS
ALTER TABLE page ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspot ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (security handled at app level)
CREATE POLICY "allow_all_page_operations" ON page FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_hotspot_operations" ON hotspot FOR ALL USING (true) WITH CHECK (true);