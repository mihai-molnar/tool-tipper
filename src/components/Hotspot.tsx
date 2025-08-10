'use client';

import { useState, useRef, useEffect } from 'react';
import { Hotspot as HotspotType } from '@/types';
import { Trash2 } from 'lucide-react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md hover:scale-125 transition-all cursor-help z-10 opacity-70 hover:opacity-100"
          style={{ left: left - 8, top: top - 8 }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          aria-label="Hotspot"
        >
          <span className="sr-only">Hotspot: {hotspot.text}</span>
        </button>
        
        {showTooltip && (() => {
          // Determine if tooltip should appear above or below the hotspot
          const spaceAbove = top;
          const _spaceBelow = containerHeight - top;
          const showBelow = spaceAbove < 60; // If less than 60px above, show below
          
          return (
            <div
              className="absolute z-20 px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg max-w-xs pointer-events-none transform -translate-x-1/2"
              style={{
                left: left,
                top: showBelow ? top + 25 : top - 55,
              }}
            >
              {hotspot.text}
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
        className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-md hover:scale-125 transition-all z-10 opacity-70 hover:opacity-100"
        style={{ left: left - 8, top: top - 8 }}
        onClick={() => setIsEditing(true)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label="Edit hotspot"
      >
        <span className="sr-only">Edit hotspot: {hotspot.text}</span>
      </button>

      {isEditing && (
        <div
          className="absolute z-30 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-64"
          style={{
            left: Math.min(left + 16, containerWidth - 280),
            top: Math.max(top - 60, 8),
          }}
        >
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border border-gray-300 rounded text-sm resize-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Enter tooltip text..."
          />
          
          <div className="flex justify-between items-center mt-2 space-x-2">
            <button
              onClick={handleDelete}
              className="flex items-center space-x-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm transition-colors"
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
        const showBelow = spaceAbove < 60; // If less than 60px above, show below
        
        return (
          <div
            className="absolute z-20 px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg max-w-xs pointer-events-none transform -translate-x-1/2"
            style={{
              left: left,
              top: showBelow ? top + 25 : top - 55,
            }}
          >
            {hotspot.text}
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