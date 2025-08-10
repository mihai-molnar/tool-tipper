import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import PublicView from './PublicView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { data: page } = await supabaseServer
      .from('page')
      .select('title, slug')
      .eq('slug', slug)
      .single();

    if (!page) {
      return {
        title: 'Page Not Found - Tool-Tipper',
      };
    }

    const title = page.title || 'Interactive Image';
    return {
      title: `${title} - Tool-Tipper`,
      description: 'An interactive image with tooltips created with Tool-Tipper',
      openGraph: {
        title,
        description: 'An interactive image with tooltips created with Tool-Tipper',
        type: 'website',
      },
    };
  } catch (error) {
    return {
      title: 'Tool-Tipper',
    };
  }
}

export default async function PublicPage({ params }: PageProps) {
  try {
    const { slug } = await params;
    // Get page data
    const { data: page, error: pageError } = await supabaseServer
      .from('page')
      .select('id, slug, title, image_path, image_width, image_height, created_at, updated_at')
      .eq('slug', slug)
      .single();

    if (pageError || !page) {
      notFound();
    }

    // Get hotspots for this page
    const { data: hotspots, error: hotspotsError } = await supabaseServer
      .from('hotspot')
      .select('id, x_pct, y_pct, text, z_index, created_at, updated_at')
      .eq('page_id', page.id)
      .order('z_index', { ascending: true });

    if (hotspotsError) {
      console.error('Hotspots error:', hotspotsError);
      notFound();
    }

    // Get image URL from Supabase Storage
    const { data: imageData } = supabaseServer.storage
      .from('images')
      .getPublicUrl(page.image_path);

    const pageWithImageUrl = {
      ...page,
      image_url: imageData.publicUrl,
    };

    return (
      <PublicView 
        page={pageWithImageUrl} 
        hotspots={hotspots || []} 
      />
    );
  } catch (_error) {
    console.error('Public page error:', _error);
    notFound();
  }
}