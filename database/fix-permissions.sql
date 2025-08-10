-- Fix permissions for Tool-Tipper
-- Run this in your Supabase SQL editor if you get permission errors

-- First, ensure the anonymous role has the necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotspot TO anon;

-- Grant usage on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure RLS is enabled
ALTER TABLE public.page ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspot ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "read pages" ON public.page;
DROP POLICY IF EXISTS "insert pages" ON public.page;
DROP POLICY IF EXISTS "update pages" ON public.page;
DROP POLICY IF EXISTS "read hotspots" ON public.hotspot;
DROP POLICY IF EXISTS "insert hotspots" ON public.hotspot;
DROP POLICY IF EXISTS "update hotspots" ON public.hotspot;
DROP POLICY IF EXISTS "delete hotspots" ON public.hotspot;

-- Create permissive policies for all operations
-- Security is handled at the application level via edit tokens

-- Page policies
CREATE POLICY "allow_all_page_operations" ON public.page
    FOR ALL USING (true) WITH CHECK (true);

-- Hotspot policies  
CREATE POLICY "allow_all_hotspot_operations" ON public.hotspot
    FOR ALL USING (true) WITH CHECK (true);

-- Alternative: More granular policies (use if the above doesn't work)
/*
CREATE POLICY "read_pages" ON public.page FOR SELECT USING (true);
CREATE POLICY "insert_pages" ON public.page FOR INSERT WITH CHECK (true);  
CREATE POLICY "update_pages" ON public.page FOR UPDATE USING (true);

CREATE POLICY "read_hotspots" ON public.hotspot FOR SELECT USING (true);
CREATE POLICY "insert_hotspots" ON public.hotspot FOR INSERT WITH CHECK (true);
CREATE POLICY "update_hotspots" ON public.hotspot FOR UPDATE USING (true);
CREATE POLICY "delete_hotspots" ON public.hotspot FOR DELETE USING (true);
*/