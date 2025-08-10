# Tool-Tipper Setup Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account

## Step 1: Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Note down your project URL and API keys from Settings > API

## Step 2: Database Setup

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `database/schema.sql` and run it
3. Verify that the `page` and `hotspot` tables were created

## Step 3: Storage Setup

1. In your Supabase dashboard, go to Storage
2. Create a new bucket called `images`
3. Set the bucket to **public** (for simplicity in v1)
4. Go to Storage > Policies and ensure there's a policy that allows:
   - Public reads from the `images` bucket
   - Authenticated uploads to the `images` bucket

### Storage Policy Examples:

```sql
-- Allow public reads from images bucket
create policy "Allow public reads" on storage.objects
for select using (bucket_id = 'images');

-- Allow anonymous uploads to images bucket (for API routes)
create policy "Allow anonymous uploads" on storage.objects
for insert with check (bucket_id = 'images');
```

## Step 4: Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase values:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anon/public key
   - `NEXT_PUBLIC_SITE_URL`: Your site URL (`http://localhost:3000` for dev)

**Note**: This app doesn't require the service role key - it uses RLS policies for security.

## Step 5: Install & Run

```bash
npm install
npm run dev
```

## Verification

1. Visit `http://localhost:3000/new` - should show upload interface
2. Upload an image - should redirect to edit page
3. Add some hotspots in edit mode
4. Visit the public URL - should show tooltips on hover

## Next Session Resume

For future development sessions, you'll need:
1. The project structure (pages, API routes, components)
2. Current progress on each feature
3. Any blockers or specific requirements for database/storage setup

## Troubleshooting

- **Database errors**: Check that RLS policies are set correctly
- **Upload errors**: Verify storage bucket exists and has proper policies
- **Environment errors**: Double-check all env vars are set correctly