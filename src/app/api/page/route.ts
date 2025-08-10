import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createPageSchema } from '@/lib/validations';
import { generateSlug, generateEditToken } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createPageSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { title } = validation.data;
    const slug = generateSlug();
    const editToken = generateEditToken();

    const { data, error } = await supabaseServer
      .from('page')
      .insert({
        slug,
        edit_token: editToken,
        title,
        // image_path will be set when image is uploaded
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create page' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      slug: data.slug,
      edit_token: data.edit_token,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}