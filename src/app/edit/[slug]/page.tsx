'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Copy, ExternalLink, Edit3, Save, X, ChevronDown, Eye, Share, Plus } from 'lucide-react';
import ImageCanvas from '@/components/ImageCanvas';
import { useToast } from '@/components/Toast';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between space-x-4">
          {/* Branding & Title - Left */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">🎯</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tool-Tipper
              </span>
            </div>
            
            <span className="text-gray-300 hidden sm:inline">/</span>
            
            {isEditingTitle ? (
              <div className="relative flex-1 min-w-0">
                <input
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  className="text-lg font-semibold border border-gray-300 rounded px-2 py-1 pr-16 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
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
            ) : (
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-gray-700 transition-colors" 
                  onClick={() => setIsEditingTitle(true)}
                  title="Click to edit title">
                {(page.title || 'Untitled').length > 20 
                  ? `${(page.title || 'Untitled').substring(0, 20)}...` 
                  : (page.title || 'Untitled')
                }
              </h1>
            )}
          </div>
          
          {/* Action Buttons - Right */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleCreateNew}
              className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer min-h-[44px] sm:min-h-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create New</span>
            </button>
            
            {/* Action Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
              >
                <span>Actions</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleViewPublic();
                        setShowDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-3" />
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        handleCopyShareLink();
                        setShowDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <Share className="w-4 h-4 mr-3" />
                      Share Link
                    </button>
                    <button
                      onClick={() => {
                        handleCopyEditLink();
                        setShowDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <Copy className="w-4 h-4 mr-3" />
                      Share Edit URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}