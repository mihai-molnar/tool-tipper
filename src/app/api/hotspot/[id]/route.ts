import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { updateHotspotSchema } from '@/lib/validations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const editToken = request.headers.get('x-edit-token');
    
    if (!editToken) {
      return NextResponse.json(
        { error: 'Edit token required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateHotspotSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Get hotspot and verify edit token
    const { data: hotspot, error: hotspotError } = await supabaseServer
      .from('hotspot')
      .select(`
        id,
        page_id,
        page!inner(id, edit_token)
      `)
      .eq('id', id)
      .single();

    if (hotspotError || !hotspot || hotspot.page.edit_token !== editToken) {
      return NextResponse.json(
        { error: 'Invalid edit token or hotspot not found' },
        { status: 403 }
      );
    }

    // Update hotspot
    const updateData = {
      ...validation.data,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from('hotspot')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update hotspot' },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const editToken = request.headers.get('x-edit-token');
    
    if (!editToken) {
      return NextResponse.json(
        { error: 'Edit token required' },
        { status: 401 }
      );
    }

    // Get hotspot and verify edit token
    const { data: hotspot, error: hotspotError } = await supabaseServer
      .from('hotspot')
      .select(`
        id,
        page_id,
        page!inner(id, edit_token)
      `)
      .eq('id', id)
      .single();

    if (hotspotError || !hotspot || hotspot.page.edit_token !== editToken) {
      return NextResponse.json(
        { error: 'Invalid edit token or hotspot not found' },
        { status: 403 }
      );
    }

    // Delete hotspot
    const { error } = await supabaseServer
      .from('hotspot')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete hotspot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}