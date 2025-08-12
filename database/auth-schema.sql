-- Authentication and User Management Schema for Tool-Tipper
-- Run this after the main schema.sql

-- Enable RLS on auth.users (if not already enabled)
-- Note: Supabase Auth automatically creates auth.users table

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
  subscription_id text, -- Stripe subscription ID
  subscription_status text CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user usage tracking table
CREATE TABLE IF NOT EXISTS public.user_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_hotspots integer DEFAULT 0 NOT NULL,
  total_pages integer DEFAULT 0 NOT NULL,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add user_id column to existing page table
ALTER TABLE public.page 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_page_user_id ON public.page(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_usage_user_id_unique ON public.user_usage(user_id);

-- RLS Policies for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can create their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_usage
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can view their own usage" ON public.user_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = user_usage.user_id AND auth.uid() = id
    )
  );

-- System can update usage (for server-side operations)
CREATE POLICY "Allow usage updates" ON public.user_usage
  FOR ALL USING (true);

-- Update page table RLS to include user ownership
DROP POLICY IF EXISTS "Allow anonymous reads" ON public.page;
CREATE POLICY "Allow public reads" ON public.page
  FOR SELECT USING (true);

-- Allow users to read their own pages and anonymous pages
CREATE POLICY "Users can manage their own pages" ON public.page
  FOR ALL USING (
    user_id IS NULL OR -- Anonymous pages (existing)
    auth.uid() = user_id -- User's own pages
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Initialize user usage
  INSERT INTO public.user_usage (user_id, total_hotspots, total_pages)
  VALUES (NEW.id, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Function to count user hotspots and update usage
CREATE OR REPLACE FUNCTION public.update_user_usage(user_uuid uuid)
RETURNS void AS $$
DECLARE
  hotspot_count integer;
  page_count integer;
BEGIN
  -- Count total hotspots for user
  SELECT COUNT(h.id) INTO hotspot_count
  FROM public.hotspot h
  JOIN public.page p ON h.page_id = p.id
  WHERE p.user_id = user_uuid;
  
  -- Count total pages for user
  SELECT COUNT(id) INTO page_count
  FROM public.page
  WHERE user_id = user_uuid;
  
  -- Update or insert usage record
  INSERT INTO public.user_usage (user_id, total_hotspots, total_pages)
  VALUES (user_uuid, hotspot_count, page_count)
  ON CONFLICT (user_id) DO UPDATE SET
    total_hotspots = EXCLUDED.total_hotspots,
    total_pages = EXCLUDED.total_pages,
    last_updated = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;