# 🎯 Tool-Tipper

**Create interactive images with tooltips and hotspots**

A production-ready web application where users can upload images and add interactive tooltips (hotspots) to create engaging, shareable content. Perfect for annotated screenshots, interactive diagrams, educational content, and more.

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-Visit%20Site-blue?style=for-the-badge)](https://tool-tipper-git-main-mihaimolnars-projects.vercel.app)
[![GitHub](https://img.shields.io/badge/📚%20GitHub-Source%20Code-black?style=for-the-badge)](https://github.com/mihai-molnar/tool-tipper)

## ✨ Features

### Core Functionality
- 🖼️ **Image Upload**: Drag & drop interface with validation (PNG/JPG/WebP, 10MB max)
- 📍 **Interactive Hotspots**: Click anywhere on images to add tooltips
- ✏️ **Inline Editing**: Edit hotspot text directly with save/cancel options
- 👁️ **Smart Tooltips**: Hover to view, with intelligent positioning
- 🗑️ **Easy Management**: Delete hotspots with confirmation dialogs

### Sharing & Access
- 🔗 **Public Sharing**: Read-only view via clean slug URLs (`/{slug}`)
- 🔐 **Edit Access**: Secure edit mode via secret tokens (`/edit/{slug}?token=...`)
- 📋 **Copy Links**: One-click copying of share and edit URLs
- 📱 **Mobile Friendly**: Responsive design works on all devices

### User Experience
- 🎯 **Professional Design**: Custom branding with target emoji favicon
- 📅 **Date Display**: Shows creation date in "08-Aug-2025" format
- 🖱️ **Intuitive Interactions**: Cursor pointers on all clickable elements
- 🔄 **Real-time Updates**: Optimistic updates with error handling

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Storage**: Supabase Storage (public bucket)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel (production) + Supabase (backend)
- **Build Tools**: TypeScript, ESLint, PostCSS

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/mihai-molnar/tool-tipper.git
cd tool-tipper
npm install
```

### 2. Environment Variables
Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Note: No service role key needed - simplified architecture!
```

### 3. Database Setup
Run the SQL schema in your Supabase SQL editor:
```sql
-- See database/schema.sql for complete setup
-- Includes tables, RLS policies, and proper permissions
```

### 4. Storage Setup
1. Create a bucket named `images` in Supabase Storage
2. Set bucket to **public access**
3. Storage policies are included in the schema

### 5. Start Development
```bash
npm run dev
# Visit http://localhost:3000
```

## 📖 Usage Guide

1. **Visit homepage** → Click "Create New"
2. **Upload image** → Drag & drop or click to select
3. **Add hotspots** → Click anywhere on the image
4. **Edit tooltips** → Type your text and save
5. **Share publicly** → Copy the share link
6. **Edit later** → Use the edit link with your secret token

## 🏗️ Architecture

### URL Structure
- **Homepage**: `/` - Landing page with "Create New" button
- **Upload**: `/new` - Image upload wizard
- **Public View**: `/{slug}` - Read-only view with hover tooltips
- **Edit Mode**: `/edit/{slug}?token={edit_token}` - Full editing capabilities

### Data Model
- **`page`**: Image metadata, public slug, secret edit token
- **`hotspot`**: Interactive tooltip coordinates and text

### Security Model
- ✅ **Public Read Access**: Anonymous Supabase key for viewing
- ✅ **RLS Policies**: Database-level security for all operations
- ✅ **Edit Token Validation**: Server-side verification for mutations
- ✅ **No Service Role Key**: Simplified, secure architecture
- ✅ **HTTPS Only**: All communications encrypted in production

## 🔧 Development

### Project Structure
```
src/
├── app/              # Next.js App Router pages
│   ├── api/         # API routes (page, upload, hotspot)
│   ├── [slug]/      # Public view page  
│   ├── edit/[slug]/ # Edit page with token auth
│   ├── new/         # Upload wizard
│   └── icon.tsx     # Dynamic favicon generation
├── components/      # Reusable React components
├── lib/            # Utilities and configurations
└── types/          # TypeScript type definitions
```

### Key Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
```

## 📚 Documentation

- [`SESSION-NOTES.md`](./SESSION-NOTES.md) - Complete development history & troubleshooting
- [`SETUP.md`](./SETUP.md) - Detailed setup instructions
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) - Technical implementation details
- [`database/schema.sql`](./database/schema.sql) - Database schema & policies

---

**✨ Ready to create interactive images? [Try it live!](https://tool-tipper-git-main-mihaimolnars-projects.vercel.app)**
