import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { isValidImageType } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pageId = formData.get('pageId') as string;

    if (!file || !pageId) {
      return NextResponse.json(
        { error: 'File and pageId are required' },
        { status: 400 }
      );
    }

    // Validate file
    if (!isValidImageType(file)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { status: 400 }
      );
    }

    // Verify page exists
    const { data: page, error: pageError } = await supabaseServer
      .from('page')
      .select('id, slug')
      .eq('id', pageId)
      .single();

    if (pageError || !page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Image dimensions will be set later on the client side if needed

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${pageId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { 
          error: 'Failed to upload image',
          details: uploadError.message
        },
        { status: 500 }
      );
    }

    // Update page with image info
    const { error: updateError } = await supabaseServer
      .from('page')
      .update({
        image_path: uploadData.path,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId);

    if (updateError) {
      console.error('Page update error:', updateError);
      // Try to clean up uploaded file
      await supabaseServer.storage
        .from('images')
        .remove([uploadData.path]);
      
      return NextResponse.json(
        { 
          error: 'Failed to update page with image info',
          details: updateError.message,
          code: updateError.code 
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseServer.storage
      .from('images')
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      image_path: uploadData.path,
      image_url: urlData.publicUrl,
      image_width: null,
      image_height: null,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}