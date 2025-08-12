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

    // Verify edit token and get page with user info
    const { data: page, error: pageError } = await supabaseServer
      .from('page')
      .select('id, edit_token, user_id')
      .eq('id', page_id)
      .single();

    if (pageError || !page || page.edit_token !== editToken) {
      return NextResponse.json(
        { error: 'Invalid edit token or page not found' },
        { status: 403 }
      );
    }

    // Check usage limits for free users
    if (page.user_id) {
      // User is authenticated - check their plan and usage
      const { data: profile, error: profileError } = await supabaseServer
        .from('user_profiles')
        .select('plan_type')
        .eq('id', page.user_id)
        .single();

      if (!profileError && profile && profile.plan_type === 'free') {
        // Count current hotspots for this user
        const { count: currentHotspots, error: countError } = await supabaseServer
          .from('hotspot')
          .select('id', { count: 'exact' })
          .in('page_id', 
            await supabaseServer
              .from('page')
              .select('id')
              .eq('user_id', page.user_id)
              .then(res => res.data?.map(p => p.id) || [])
          );

        if (!countError && currentHotspots !== null && currentHotspots >= 10) {
          return NextResponse.json(
            { error: 'FREE_LIMIT_REACHED', message: 'Free plan limited to 10 hotspots. Upgrade to Pro for unlimited hotspots.' },
            { status: 402 } // Payment Required
          );
        }
      }
    } else {
      // Anonymous user - count hotspots for this specific page
      const { count: pageHotspots, error: countError } = await supabaseServer
        .from('hotspot')
        .select('id', { count: 'exact' })
        .eq('page_id', page_id);

      if (!countError && pageHotspots !== null && pageHotspots >= 10) {
        return NextResponse.json(
          { error: 'ANONYMOUS_LIMIT_REACHED', message: 'Anonymous users limited to 10 hotspots per image. Sign up for unlimited hotspots.' },
          { status: 402 } // Payment Required
        );
      }
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