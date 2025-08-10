'use client';

// import { useState } from 'react';
import { Share, Upload } from 'lucide-react';
import Link from 'next/link';
import ImageCanvas from '@/components/ImageCanvas';
import { useToast } from '@/components/Toast';
import { Page, Hotspot } from '@/types';

interface PublicViewProps {
  page: Page & { image_url: string };
  hotspots: Hotspot[];
}

export default function PublicView({ page, hotspots }: PublicViewProps) {
  const { showToast, ToastComponent } = useToast();

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
              Tool-Tipper
            </Link>
            {page.title && (
              <>
                <span className="text-gray-300">/</span>
                <h1 className="text-lg font-semibold text-gray-900">{page.title}</h1>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Share className="w-4 h-4" />
              <span>Share</span>
            </button>
            <Link
              href="/new"
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Create Your Own</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-none overflow-hidden">
          <ImageCanvas
            imageUrl={page.image_url}
            hotspots={hotspots}
            mode="view"
          />

          {hotspots.length === 0 && (
            <div className="text-center mt-8 py-8 text-gray-500">
              <p>No hotspots have been added to this image yet.</p>
            </div>
          )}
        </div>

        {/* Image info */}
        <div className="text-center mt-4 text-sm text-gray-500">
          <p>Hover over the blue dots to see tooltips</p>
          {page.created_at && (
            <p className="mt-1">
              Created on {new Date(page.created_at).toLocaleDateString()}
            </p>
          )}
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