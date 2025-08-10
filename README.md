# Tool-Tipper

A web app where users can upload images and add interactive tooltips (hotspots) to them. Built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- Upload images and create shareable pages
- Add interactive hotspots with tooltips
- Public read-only view via slug URLs
- Admin edit access via secret tokens
- Responsive design with mobile support

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **Deployment**: Vercel + Supabase

## Setup

### 1. Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Database Setup

Run the SQL schema in your Supabase SQL editor (see `database/schema.sql`)

### 3. Storage Setup

1. Create a bucket named `images` in Supabase Storage
2. Set bucket to public access
3. Configure upload policies

### 4. Development

```bash
npm run dev
```

## Architecture

- **Public URLs**: `/{slug}` - Read-only view
- **Edit URLs**: `/edit/{slug}?token={edit_token}` - Admin edit access
- **Create**: `/new` - Upload new image and create page

## Data Model

- `page`: Contains image metadata, public slug, and secret edit token
- `hotspot`: Interactive tooltip points linked to a page

## Security

- Public read access via anonymous Supabase key
- Write operations secured by Row Level Security (RLS) policies
- Edit token validation for all mutations
- No service role key required (simplified architecture)
- API keys properly secured (only anon key exposed by design)
