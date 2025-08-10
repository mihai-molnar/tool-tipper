'use client';

import { useRef, useState, useEffect } from 'react';
import { Hotspot as HotspotType } from '@/types';
import Hotspot from './Hotspot';

interface ImageCanvasProps {
  imageUrl: string;
  hotspots: HotspotType[];
  mode: 'view' | 'edit';
  onCreate?: (x_pct: number, y_pct: number, text: string) => void;
  onUpdate?: (id: string, updates: { text?: string; x_pct?: number; y_pct?: number }) => void;
  onDelete?: (id: string) => void;
}

export default function ImageCanvas({
  imageUrl,
  hotspots,
  mode,
  onCreate,
  onUpdate,
  onDelete,
}: ImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [_containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showNewHotspotForm, setShowNewHotspotForm] = useState(false);
  const [newHotspotPosition, setNewHotspotPosition] = useState({ x: 0, y: 0, x_pct: 0, y_pct: 0 });
  const [newHotspotText, setNewHotspotText] = useState('');

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && imageRef.current) {
        const imageRect = imageRef.current.getBoundingClientRect();
        setContainerSize({ 
          width: imageRect.width, 
          height: imageRect.height 
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [imageUrl]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (mode !== 'edit' || !onCreate || !containerRef.current || !imageRef.current) return;

    const imageRect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Click position relative to image
    const imageX = e.clientX - imageRect.left;
    const imageY = e.clientY - imageRect.top;
    const x_pct = imageX / imageRect.width;
    const y_pct = imageY / imageRect.height;

    // Click position relative to container (for positioning the form)
    const containerX = e.clientX - containerRect.left;
    const containerY = e.clientY - containerRect.top;

    // Validate coordinates
    if (x_pct < 0 || x_pct > 1 || y_pct < 0 || y_pct > 1) return;

    setNewHotspotPosition({ x: containerX, y: containerY, x_pct, y_pct });
    setShowNewHotspotForm(true);
    setNewHotspotText('');
  };

  const handleSaveNewHotspot = () => {
    if (onCreate && newHotspotText.trim()) {
      onCreate(newHotspotPosition.x_pct, newHotspotPosition.y_pct, newHotspotText.trim());
      setShowNewHotspotForm(false);
      setNewHotspotText('');
    }
  };

  const handleCancelNewHotspot = () => {
    setShowNewHotspotForm(false);
    setNewHotspotText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveNewHotspot();
    } else if (e.key === 'Escape') {
      handleCancelNewHotspot();
    }
  };

  return (
    <div className="relative inline-block w-full">
      <div ref={containerRef} className="relative w-full flex justify-center">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Canvas image"
          className={`max-w-full max-h-[70vh] w-auto h-auto object-contain ${mode === 'edit' ? 'cursor-crosshair' : ''}`}
          onClick={handleImageClick}
          onLoad={() => {
            if (containerRef.current && imageRef.current) {
              const imageRect = imageRef.current.getBoundingClientRect();
              setContainerSize({ width: imageRect.width, height: imageRect.height });
            }
          }}
        />

        {/* Render existing hotspots */}
        {hotspots.map((hotspot) => {
          // Calculate hotspot position relative to the current container
          const imageRect = imageRef.current?.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          
          if (!imageRect || !containerRect) return null;
          
          // Calculate the offset of the image within the container
          const imageOffsetX = imageRect.left - containerRect.left;
          const imageOffsetY = imageRect.top - containerRect.top;
          
          return (
            <Hotspot
              key={hotspot.id}
              hotspot={{
                ...hotspot,
                // Adjust positions to account for image offset within container
                x_pct: (hotspot.x_pct * imageRect.width + imageOffsetX) / containerRect.width,
                y_pct: (hotspot.y_pct * imageRect.height + imageOffsetY) / containerRect.height,
              }}
              mode={mode}
              onUpdate={onUpdate}
              onDelete={onDelete}
              containerWidth={containerRect.width}
              containerHeight={containerRect.height}
            />
          );
        })}

        {/* New hotspot being created */}
        {showNewHotspotForm && mode === 'edit' && (
          <>
            <div
              className="absolute w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-md z-10"
              style={{
                left: newHotspotPosition.x - 8,
                top: newHotspotPosition.y - 8,
              }}
            />
            
            <div
              className="absolute z-30 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-64"
              style={{
                left: Math.min(newHotspotPosition.x + 16, window.innerWidth - 300),
                top: Math.max(newHotspotPosition.y - 60, 8),
              }}
            >
              <textarea
                value={newHotspotText}
                onChange={(e) => setNewHotspotText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 border border-gray-300 rounded text-sm resize-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter tooltip text..."
                autoFocus
              />
              
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={handleCancelNewHotspot}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewHotspot}
                  className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm transition-colors"
                  disabled={!newHotspotText.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {mode === 'edit' && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Click on the image to add a new hotspot
        </p>
      )}
    </div>
  );
}