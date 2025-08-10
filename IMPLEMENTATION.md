# Tool-Tipper Implementation Details

## Architecture Overview

The app uses Next.js 14 with the App Router and follows a simple client-server architecture:

- **Frontend**: React components with TypeScript
- **Backend**: Next.js API Routes with Supabase database
- **Storage**: Supabase Storage for images
- **Security**: Row Level Security (RLS) with edit token validation

## Key Components

### 1. ImageCanvas (`src/components/ImageCanvas.tsx`)
- Handles image display and hotspot interactions
- Supports both view and edit modes
- Manages coordinate conversion (pixels ↔ percentages)
- Handles click events for hotspot creation

### 2. Hotspot (`src/components/Hotspot.tsx`)
- Renders individual hotspot dots
- Shows tooltips on hover (view mode)
- Provides inline editing interface (edit mode)
- Handles CRUD operations for hotspot data

### 3. UploadDropzone (`src/components/UploadDropzone.tsx`)
- Drag & drop file upload interface
- File validation (type, size)
- Visual feedback for upload states

## API Routes

### `/api/page`
- `POST`: Create new page with slug and edit token

### `/api/page/[slug]`
- `GET`: Fetch page data and hotspots (public)
- `PATCH`: Update page title (requires edit token)

### `/api/upload`
- `POST`: Upload image file to Supabase Storage

### `/api/hotspot`
- `POST`: Create new hotspot (requires edit token)

### `/api/hotspot/[id]`
- `PATCH`: Update hotspot (requires edit token)
- `DELETE`: Delete hotspot (requires edit token)

## Security Model

### Without Service Role Key

The app uses a simplified security model:

1. **Public Operations**: Anyone can create pages and view public pages
2. **Edit Operations**: Require a secret edit token passed in headers
3. **RLS Policies**: Database policies allow public reads and writes (server validates tokens)
4. **Token Validation**: Server-side validation ensures only holders of edit tokens can modify data

### Token Flow

1. User creates page → gets `slug` (public) and `edit_token` (secret)
2. Edit operations send `X-Edit-Token` header
3. Server validates token against database before allowing changes
4. Public views only need the slug

## Database Schema

### `page` table
- Stores page metadata, image path, and edit token
- `slug`: Public identifier (8 chars, URL-safe)
- `edit_token`: Secret token (32 chars, for write access)
- `image_path`: Path to image in Supabase Storage

### `hotspot` table
- Stores tooltip positions and text
- Coordinates stored as percentages (0.0-1.0) for responsive positioning
- References parent page with foreign key constraint

## Coordinate System

Hotspots use percentage-based positioning:

```typescript
// Click position to percentage
const x_pct = (clickX - imageLeft) / imageWidth;
const y_pct = (clickY - imageTop) / imageHeight;

// Percentage to render position
const left = x_pct * containerWidth;
const top = y_pct * containerHeight;
```

This ensures hotspots stay in correct positions when:
- Window is resized
- Image is viewed on different screen sizes
- Image aspect ratio is maintained

## File Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── edit/[slug]/   # Edit page
│   ├── [slug]/        # Public view page
│   ├── new/           # Upload wizard
│   └── page.tsx       # Landing page
├── components/        # Reusable components
├── lib/              # Utilities and configs
└── types/            # TypeScript definitions
```

## Error Handling

- **Client**: Toast notifications for user feedback
- **Server**: Proper HTTP status codes and error messages
- **Database**: Validation constraints and foreign key relationships
- **Storage**: File type and size validation

## Performance Considerations

- **Image Optimization**: Next.js Image component for optimized loading
- **Lazy Loading**: Images load only when needed
- **Responsive**: Percentage-based positioning scales efficiently
- **Minimal Payloads**: Only essential data in API responses

## Testing Strategy

### Manual Testing Checklist

1. **Upload Flow**
   - [ ] Can create new page via `/new`
   - [ ] File validation works (type, size)
   - [ ] Redirects to edit page after upload

2. **Editor**
   - [ ] Can click image to add hotspots
   - [ ] Can edit hotspot text inline
   - [ ] Can delete hotspots
   - [ ] Can update page title
   - [ ] Copy share/edit links work

3. **Public View**
   - [ ] Public URLs work without edit token
   - [ ] Tooltips appear on hover
   - [ ] Responsive on different screen sizes
   - [ ] Share functionality works

4. **Security**
   - [ ] Edit operations fail without valid token
   - [ ] Public view doesn't expose edit tokens
   - [ ] Database enforces constraints

## Recent Updates & Fixes (2025-08-10)

### UI/UX Improvements
- **Semi-transparent hotspots**: 70% opacity, 100% on hover for less obstruction
- **Smart tooltip positioning**: Automatically flips above/below based on available space
- **Improved spacing**: Better gap between tooltips and hotspots (55px above, 25px below)
- **Edit mode tooltips**: Preview hotspot text on hover even in edit mode
- **Responsive image sizing**: Images fit within 70% viewport height, no scrolling needed
- **Fixed input text color**: All form fields now have properly visible dark text

### Technical Fixes
- **Coordinate system**: Fixed hotspot positioning after image centering/scaling
- **Click detection**: Accurate conversion between screen coordinates and image percentages
- **Image display**: Proper centering and aspect ratio preservation
- **Form positioning**: Textarea appears exactly where user clicks

### Security Verification
- **API key safety**: Confirmed no sensitive keys leaked in browser requests
- **Environment security**: Only necessary public keys exposed
- **Edit token validation**: Server-side verification prevents unauthorized changes

## Future Enhancements

1. **Drag & Drop Hotspots**: Allow repositioning existing hotspots
2. **Image Zoom**: Pan/zoom for large images
3. **Bulk Operations**: Multi-select and bulk delete
4. **Export**: JSON export of hotspot data
5. **Analytics**: Basic usage tracking
6. **Rate Limiting**: Prevent abuse of API endpoints

## Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Make sure Supabase project is properly configured for production use.