'use client';

// import { useState } from 'react';
import { Share, Plus } from 'lucide-react';
import Link from 'next/link';
import ImageCanvas from '@/components/ImageCanvas';
import { useToast } from '@/components/Toast';
import Header from '@/components/Header';
import Tooltip from '@/components/Tooltip';
import { Page, Hotspot } from '@/types';
import { isTouchDevice } from '@/lib/touch';

interface PublicViewProps {
  page: Page & { image_url: string };
  hotspots: Hotspot[];
}

export default function PublicView({ page, hotspots }: PublicViewProps) {
  const { showToast, ToastComponent } = useToast();
  const isTouch = isTouchDevice();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: page.title || 'Interactive Image',
          text: 'Check out this interactive image with tooltips',
          url: url,
        });
      } catch (_err) {
        // User cancelled or share failed, fall back to clipboard
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', 'Link copied to clipboard');
    } catch (_err) {
      showToast('error', 'Failed to copy link');
    }
  };

  const actions = (
    <>
      <Tooltip content="Share">
        <button
          onClick={handleShare}
          className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Share className="w-4 h-4" />
        </button>
      </Tooltip>
      <Tooltip content="Create Your Own">
        <Link
          href="/new"
          className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </Link>
      </Tooltip>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={page.title || undefined}
        actions={actions}
      />

      {/* Canvas */}
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 max-w-none overflow-hidden">
          <ImageCanvas
            imageUrl={page.image_url}
            hotspots={hotspots}
            mode="view"
          />

          {hotspots.length === 0 && (
            <div className="text-center mt-8 py-8 text-gray-500">
              <p className="text-sm sm:text-base">No hotspots have been added to this image yet.</p>
            </div>
          )}
        </div>

        {/* Image info */}
        <div className="text-center mt-4 text-sm sm:text-sm text-gray-500 px-4">
          <p>{isTouch ? 'Tap the blue dots to see tooltips' : 'Hover over the blue dots to see tooltips'}</p>
          {page.created_at && (
            <p className="mt-1">
              Created on {formatDate(page.created_at)}
            </p>
          )}
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