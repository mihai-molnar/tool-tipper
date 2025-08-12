'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Save, X, Share, Plus } from 'lucide-react';
import ImageCanvas from '@/components/ImageCanvas';
import { useToast } from '@/components/Toast';
import Header from '@/components/Header';
import Tooltip from '@/components/Tooltip';
import UpgradeModal from '@/components/UpgradeModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Page, Hotspot } from '@/types';
import { isTouchDevice } from '@/lib/touch';
import Link from 'next/link';

export default function EditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const isTouch = isTouchDevice();
  
  const slug = params.slug as string;
  const editToken = searchParams.get('token');
  
  const [page, setPage] = useState<Page | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const { user, profile, canCreateHotspot, getRemainingHotspots, refreshUsage } = useAuth();

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

  useEffect(() => {
    if (!editToken) {
      setError('Edit token is required');
      setLoading(false);
      return;
    }

    fetchPageData();
  }, [slug, editToken, fetchPageData]);


  const handleCreateHotspot = async (x_pct: number, y_pct: number, text: string) => {
    if (!editToken || !page) return;

    // Check if user can create more hotspots (client-side check)
    const currentCount = hotspots.length;
    const maxFreeHotspots = 10;
    
    // For signed-in users, check their plan and total usage
    if (user && profile && profile.plan_type === 'free') {
      if (!canCreateHotspot()) {
        setShowUpgradeModal(true);
        return;
      }
    } else if (!user) {
      // Anonymous user - check current page hotspots
      if (currentCount >= maxFreeHotspots) {
        setShowUpgradeModal(true);
        return;
      }
    }

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

      if (response.status === 402) {
        // Payment required - show upgrade modal
        const errorData = await response.json();
        setHotspots(prev => prev.filter(h => h.id !== tempId));
        setShowUpgradeModal(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to create hotspot');
      }

      const newHotspot = await response.json();
      setHotspots(prev => prev.map(h => h.id === tempId ? newHotspot : h));
      showToast('success', 'Hotspot created');
      
      // Refresh usage data for signed-in users
      if (user) {
        await refreshUsage();
      }
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
      
      // Refresh usage data for signed-in users
      if (user) {
        await refreshUsage();
      }
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

  const handleCreateNew = () => {
    router.push('/new');
  };

  const getImageUrl = (page: Page) => {
    if (page.image_url) {
      return page.image_url;
    }
    // Fallback: generate URL from image_path
    const { data } = supabase.storage.from('images').getPublicUrl(page.image_path);
    return data.publicUrl;
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const titleElement = isEditingTitle ? (
    <div className="relative min-w-0 max-w-sm">
      <input
        value={titleValue}
        onChange={(e) => setTitleValue(e.target.value)}
        className="text-lg font-semibold border border-gray-300 rounded px-2 py-1 pr-16 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full min-w-0"
        placeholder="Enter title..."
        maxLength={30}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleUpdateTitle();
          if (e.key === 'Escape') {
            setIsEditingTitle(false);
            setTitleValue(page.title || '');
          }
        }}
        autoFocus
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center space-x-1">
        <button
          onClick={() => {
            setIsEditingTitle(false);
            setTitleValue(page.title || '');
          }}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer rounded hover:bg-gray-100 transition-colors"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
        <button
          onClick={handleUpdateTitle}
          className="p-1 text-green-600 hover:text-green-700 cursor-pointer rounded hover:bg-green-50 transition-colors"
          title="Save"
        >
          <Save className="w-3 h-3" />
        </button>
      </div>
    </div>
  ) : null;

  const actions = (
    <>
      <Tooltip content="Create New">
        <button
          onClick={handleCreateNew}
          className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </Tooltip>
      
      <Tooltip content="Share">
        <button
          onClick={handleCopyShareLink}
          className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Share className="w-4 h-4" />
        </button>
      </Tooltip>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={page.title || 'Untitled'}
        onTitleEdit={() => setIsEditingTitle(true)}
        isEditingTitle={isEditingTitle}
        actions={actions}
      />
      
      {/* Render title editing outside header when editing */}
      {isEditingTitle && (
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2">
          {titleElement}
        </div>
      )}

      {/* Canvas */}
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 max-w-none overflow-hidden">
          <ImageCanvas
            imageUrl={getImageUrl(page)}
            hotspots={hotspots}
            mode="edit"
            onCreate={handleCreateHotspot}
            onUpdate={handleUpdateHotspot}
            onDelete={handleDeleteHotspot}
          />
        </div>
      </div>

      {ToastComponent && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 sm:min-w-96">
          {ToastComponent}
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentHotspots={user && profile ? (profile.plan_type === 'free' ? 10 - getRemainingHotspots() : hotspots.length) : hotspots.length}
        maxHotspots={10}
        isSignedIn={!!user}
      />
    </div>
  );
}