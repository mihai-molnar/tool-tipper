'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Copy, ExternalLink, Edit3, Save } from 'lucide-react';
import ImageCanvas from '@/components/ImageCanvas';
import { useToast } from '@/components/Toast';
import { Page, Hotspot } from '@/types';

export default function EditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  
  const slug = params.slug as string;
  const editToken = searchParams.get('token');
  
  const [page, setPage] = useState<Page | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  useEffect(() => {
    if (!editToken) {
      setError('Edit token is required');
      setLoading(false);
      return;
    }

    fetchPageData();
  }, [slug, editToken, fetchPageData]);

  const fetchPageData = useCallback(async () => {
    try {
      const response = await fetch(`/api/page/${slug}`);
      
      if (!response.ok) {
        throw new Error('Page not found');
      }

      const data = await response.json();
      setPage(data.page);
      setHotspots(data.hotspots);
      setTitleValue(data.page.title || '');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load page');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const handleCreateHotspot = async (x_pct: number, y_pct: number, text: string) => {
    if (!editToken || !page) return;

    // Show temporary hotspot
    const tempId = Date.now().toString();
    const tempHotspot: Hotspot = {
      id: tempId,
      page_id: page.id,
      x_pct,
      y_pct,
      text,
      z_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setHotspots(prev => [...prev, tempHotspot]);

    try {
      const response = await fetch('/api/hotspot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Edit-Token': editToken,
        },
        body: JSON.stringify({
          page_id: page.id,
          x_pct,
          y_pct,
          text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create hotspot');
      }

      const newHotspot = await response.json();
      setHotspots(prev => prev.map(h => h.id === tempId ? newHotspot : h));
    } catch (_err) {
      setHotspots(prev => prev.filter(h => h.id !== tempId));
      showToast('error', 'Failed to create hotspot');
    }
  };

  const handleUpdateHotspot = async (id: string, updates: { text?: string; x_pct?: number; y_pct?: number }) => {
    if (!editToken) return;

    // Optimistic update
    setHotspots(prev => prev.map(h => 
      h.id === id ? { ...h, ...updates, updated_at: new Date().toISOString() } : h
    ));

    try {
      const response = await fetch(`/api/hotspot/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Edit-Token': editToken,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update hotspot');
      }

      const updatedHotspot = await response.json();
      setHotspots(prev => prev.map(h => h.id === id ? updatedHotspot : h));
    } catch (_err) {
      // Revert optimistic update
      fetchPageData();
      showToast('error', 'Failed to update hotspot');
    }
  };

  const handleDeleteHotspot = async (id: string) => {
    if (!editToken) return;

    // Optimistic update
    setHotspots(prev => prev.filter(h => h.id !== id));

    try {
      const response = await fetch(`/api/hotspot/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Edit-Token': editToken,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete hotspot');
      }

      showToast('success', 'Hotspot deleted');
    } catch (_err) {
      // Revert optimistic update
      fetchPageData();
      showToast('error', 'Failed to delete hotspot');
    }
  };

  const handleUpdateTitle = async () => {
    if (!editToken || !page) return;

    try {
      const response = await fetch(`/api/page/${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Edit-Token': editToken,
        },
        body: JSON.stringify({ title: titleValue.trim() || undefined }),
      });

      if (!response.ok) {
        throw new Error('Failed to update title');
      }

      const updatedPage = await response.json();
      setPage(updatedPage);
      setIsEditingTitle(false);
      showToast('success', 'Title updated');
    } catch (_err) {
      showToast('error', 'Failed to update title');
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', `${label} copied to clipboard`);
    } catch (_err) {
      showToast('error', 'Failed to copy to clipboard');
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/${slug}`;
    copyToClipboard(shareUrl, 'Share link');
  };

  const handleCopyEditLink = () => {
    const editUrl = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/edit/${slug}?token=${editToken}`;
    copyToClipboard(editUrl, 'Edit link');
  };

  const handleViewPublic = () => {
    window.open(`/${slug}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested page could not be found.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    className="text-xl font-semibold border border-gray-300 rounded px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter title..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateTitle();
                      if (e.key === 'Escape') {
                        setIsEditingTitle(false);
                        setTitleValue(page.title || '');
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateTitle}
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {page.title || 'Untitled'}
                  </h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleViewPublic}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View</span>
            </button>
            <button
              onClick={handleCopyShareLink}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button
              onClick={handleCopyEditLink}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Edit Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-none overflow-hidden">
          <ImageCanvas
            imageUrl={page.image_url}
            hotspots={hotspots}
            mode="edit"
            onCreate={handleCreateHotspot}
            onUpdate={handleUpdateHotspot}
            onDelete={handleDeleteHotspot}
          />
        </div>
      </div>

      {ToastComponent && (
        <div className="fixed top-4 right-4 z-50 min-w-96">
          {ToastComponent}
        </div>
      )}
    </div>
  );
}