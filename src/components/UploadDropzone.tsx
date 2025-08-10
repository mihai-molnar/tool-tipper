'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { isValidImageType } from '@/lib/utils';

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function UploadDropzone({ onFileSelect, disabled }: UploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((e) => e.code === 'file-too-large')) {
        setError('File size too large. Maximum 10MB allowed.');
      } else {
        setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      if (!isValidImageType(file)) {
        setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
        return;
      }

      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <Upload className={`w-12 h-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop your image here' : 'Upload an image'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag & drop or click to select • JPEG, PNG, WebP • Max 10MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <X className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}