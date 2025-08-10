import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get page data
    const { data: page, error: pageError } = await supabaseServer
      .from('page')
      .select('id, slug, title, image_path, image_width, image_height, created_at, updated_at')
      .eq('slug', slug)
      .single();

    if (pageError || !page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Get hotspots for this page
    const { data: hotspots, error: hotspotsError } = await supabaseServer
      .from('hotspot')
      .select('id, page_id, x_pct, y_pct, text, z_index, created_at, updated_at')
      .eq('page_id', page.id)
      .order('z_index', { ascending: true });

    if (hotspotsError) {
      console.error('Hotspots error:', hotspotsError);
      return NextResponse.json(
        { error: 'Failed to fetch hotspots' },
        { status: 500 }
      );
    }

    // Get image URL from Supabase Storage
    const { data: imageData } = supabaseServer.storage
      .from('images')
      .getPublicUrl(page.image_path);

    return NextResponse.json({
      page: {
        ...page,
        image_url: imageData.publicUrl,
      },
      hotspots: hotspots || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const editToken = request.headers.get('x-edit-token');
    
    if (!editToken) {
      return NextResponse.json(
        { error: 'Edit token required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Verify edit token and get page
    const { data: page, error: pageError } = await supabaseServer
      .from('page')
      .select('id, edit_token')
      .eq('slug', slug)
      .single();

    if (pageError || !page || page.edit_token !== editToken) {
      return NextResponse.json(
        { error: 'Invalid edit token or page not found' },
        { status: 403 }
      );
    }

    // Update page
    const { data, error } = await supabaseServer
      .from('page')
      .update({
        title: body.title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update page' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}