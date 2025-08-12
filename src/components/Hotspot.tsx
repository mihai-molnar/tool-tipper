'use client';

import { useState, useRef, useEffect } from 'react';
import { Hotspot as HotspotType } from '@/types';
import { Trash2 } from 'lucide-react';
import { isTouchDevice, isMobileViewport } from '@/lib/touch';

interface HotspotProps {
  hotspot: HotspotType;
  mode: 'view' | 'edit';
  onUpdate?: (id: string, updates: { text?: string; x_pct?: number; y_pct?: number }) => void;
  onDelete?: (id: string) => void;
  containerWidth: number;
  containerHeight: number;
}

export default function Hotspot({
  hotspot,
  mode,
  onUpdate,
  onDelete,
  containerWidth,
  containerHeight,
}: HotspotProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(hotspot.text);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isTouch = isTouchDevice();
  const isMobile = isMobileViewport();

  const left = hotspot.x_pct * containerWidth;
  const top = hotspot.y_pct * containerHeight;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (onUpdate && editText.trim() !== hotspot.text) {
      onUpdate(hotspot.id, { text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(hotspot.text);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Delete this hotspot?')) {
      onDelete(hotspot.id);
    }
  };

  const handleHotspotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isTouch) {
      // Touch device: tap to toggle tooltip, double tap to edit (edit mode only)
      if (mode === 'edit') {
        if (showTooltip) {
          setIsEditing(true);
          setShowTooltip(false);
        } else {
          setShowTooltip(true);
        }
      } else {
        // View mode: toggle tooltip
        setShowTooltip(!showTooltip);
      }
    } else {
      // Non-touch: immediate edit in edit mode
      if (mode === 'edit') {
        setIsEditing(true);
      }
    }
  };

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  // Close tooltip when clicking outside (for touch devices)
  useEffect(() => {
    if (!isTouch || !showTooltip) return;

    const handleDocumentClick = (e: Event) => {
      // Don't close if clicking on this hotspot or its tooltip
      if (e.target instanceof Element) {
        const hotspotElement = e.target.closest('[data-hotspot-id]');
        if (hotspotElement?.getAttribute('data-hotspot-id') === hotspot.id) {
          return;
        }
      }
      setShowTooltip(false);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [showTooltip, isTouch, hotspot.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (mode === 'view') {
    return (
      <>
        <button
          className={`absolute ${isMobile ? 'w-6 h-6' : 'w-4 h-4'} bg-blue-500 border-2 border-white rounded-full shadow-md transition-all z-10 ${
            isTouch 
              ? `${isPressed ? 'scale-90' : 'scale-100'} ${showTooltip ? 'opacity-100 ring-2 ring-blue-300' : 'opacity-70'} active:scale-90`
              : 'hover:scale-125 opacity-70 hover:opacity-100 cursor-help'
          }`}
          style={{ left: left - (isMobile ? 12 : 8), top: top - (isMobile ? 12 : 8) }}
          onClick={handleHotspotClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={!isTouch ? () => setShowTooltip(true) : undefined}
          onMouseLeave={!isTouch ? () => setShowTooltip(false) : undefined}
          onFocus={() => setShowTooltip(true)}
          onBlur={!isTouch ? () => setShowTooltip(false) : undefined}
          aria-label="Hotspot"
          data-hotspot-id={hotspot.id}
        >
          <span className="sr-only">Hotspot: {hotspot.text}</span>
        </button>
        
        {showTooltip && (() => {
          // Determine if tooltip should appear above or below the hotspot
          const spaceAbove = top;
          const _spaceBelow = containerHeight - top;
          const showBelow = spaceAbove < (isMobile ? 80 : 60);
          const tooltipOffset = isMobile ? 35 : 25;
          
          return (
            <div
              className={`absolute z-20 px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg transform -translate-x-1/2 ${
                isMobile ? 'max-w-[280px] text-base py-3' : 'max-w-xs'
              } ${isTouch ? 'pointer-events-auto' : 'pointer-events-none'}`}
              style={{
                left: Math.max(Math.min(left, containerWidth - 140), 140), // Keep tooltip in bounds
                top: showBelow ? top + tooltipOffset : top - (isMobile ? 75 : 55),
              }}
              data-hotspot-id={hotspot.id}
              onClick={(e) => e.stopPropagation()}
            >
              {hotspot.text}
              {isTouch && (
                <button
                  className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTooltip(false);
                  }}
                  aria-label="Close tooltip"
                >
                  ×
                </button>
              )}
              <div
                className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
                style={{
                  left: 'calc(50% - 4px)',
                  [showBelow ? 'top' : 'bottom']: -4,
                }}
              />
            </div>
          );
        })()}
      </>
    );
  }

  return (
    <>
      <button
        className={`absolute ${isMobile ? 'w-6 h-6' : 'w-4 h-4'} bg-red-500 border-2 border-white rounded-full shadow-md transition-all z-10 ${
          isTouch 
            ? `${isPressed ? 'scale-90' : 'scale-100'} ${showTooltip ? 'opacity-100 ring-2 ring-red-300' : 'opacity-70'} active:scale-90`
            : 'hover:scale-125 opacity-70 hover:opacity-100 cursor-pointer'
        }`}
        style={{ left: left - (isMobile ? 12 : 8), top: top - (isMobile ? 12 : 8) }}
        onClick={handleHotspotClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={!isTouch ? () => setShowTooltip(true) : undefined}
        onMouseLeave={!isTouch ? () => setShowTooltip(false) : undefined}
        onFocus={() => setShowTooltip(true)}
        onBlur={!isTouch ? () => setShowTooltip(false) : undefined}
        aria-label="Edit hotspot"
        data-hotspot-id={hotspot.id}
      >
        <span className="sr-only">Edit hotspot: {hotspot.text}</span>
      </button>

      {isEditing && (
        <div
          className={`absolute z-30 bg-white border border-gray-300 rounded-lg shadow-lg p-3 ${
            isMobile ? 'left-2 right-2 min-w-0' : 'min-w-64'
          }`}
          style={isMobile ? {
            top: Math.max(top + 30, 8),
          } : {
            left: Math.min(left + 16, containerWidth - 280),
            top: Math.max(top - 60, 8),
          }}
        >
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full p-2 border border-gray-300 rounded resize-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isMobile ? 'text-base min-h-[100px]' : 'text-sm'
            }`}
            rows={isMobile ? 4 : 3}
            placeholder="Enter tooltip text..."
          />
          
          <div className={`flex justify-between items-center mt-3 ${
            isMobile ? 'flex-col space-y-3' : 'space-x-2'
          }`}>
            <button
              onClick={handleDelete}
              className={`flex items-center justify-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer ${
                isMobile ? 'w-full text-base min-h-[44px]' : 'text-sm'
              }`}
            >
              <Trash2 className={isMobile ? 'w-4 h-4' : 'w-3 h-3'} />
              <span>Delete</span>
            </button>
            
            <div className={`flex ${
              isMobile ? 'w-full space-x-3' : 'space-x-2'
            }`}>
              <button
                onClick={handleCancel}
                className={`px-3 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer ${
                  isMobile ? 'flex-1 text-base min-h-[44px]' : 'text-sm'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors cursor-pointer disabled:opacity-50 ${
                  isMobile ? 'flex-1 text-base min-h-[44px]' : 'text-sm'
                }`}
                disabled={!editText.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip for edit mode - show on hover when not editing */}
      {mode === 'edit' && showTooltip && !isEditing && (() => {
        // Determine if tooltip should appear above or below the hotspot
        const spaceAbove = top;
        const _spaceBelow = containerHeight - top;
        const showBelow = spaceAbove < (isMobile ? 80 : 60);
        const tooltipOffset = isMobile ? 35 : 25;
        
        return (
          <div
            className={`absolute z-20 px-3 py-2 bg-gray-900 text-white rounded-md shadow-lg transform -translate-x-1/2 ${
              isMobile ? 'max-w-[280px] text-base py-3' : 'max-w-xs text-sm'
            } ${isTouch ? 'pointer-events-auto' : 'pointer-events-none'}`}
            style={{
              left: Math.max(Math.min(left, containerWidth - 140), 140),
              top: showBelow ? top + tooltipOffset : top - (isMobile ? 75 : 55),
            }}
            data-hotspot-id={hotspot.id}
            onClick={(e) => e.stopPropagation()}
          >
            {isTouch ? (
              <div className="flex items-center justify-between">
                <span className="flex-1">{hotspot.text}</span>
                <button
                  className="ml-2 w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-xs transition-colors flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTooltip(false);
                  }}
                  aria-label="Close tooltip"
                >
                  ×
                </button>
              </div>
            ) : (
              hotspot.text
            )}
            <div
              className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
              style={{
                left: 'calc(50% - 4px)',
                [showBelow ? 'top' : 'bottom']: -4,
              }}
            />
          </div>
        );
      })()}
    </>
  );
}