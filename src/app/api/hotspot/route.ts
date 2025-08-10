import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createHotspotSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const editToken = request.headers.get('x-edit-token');
    
    if (!editToken) {
      return NextResponse.json(
        { error: 'Edit token required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createHotspotSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { page_id, x_pct, y_pct, text } = validation.data;

    // Verify edit token
    const { data: page, error: pageError } = await supabaseServer
      .from('page')
      .select('id, edit_token')
      .eq('id', page_id)
      .single();

    if (pageError || !page || page.edit_token !== editToken) {
      return NextResponse.json(
        { error: 'Invalid edit token or page not found' },
        { status: 403 }
      );
    }

    // Create hotspot
    const { data, error } = await supabaseServer
      .from('hotspot')
      .insert({
        page_id,
        x_pct,
        y_pct,
        text,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create hotspot' },
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