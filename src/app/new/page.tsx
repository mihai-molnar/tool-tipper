'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadDropzone from '@/components/UploadDropzone';
import { useToast } from '@/components/Toast';
import { CreatePageResponse, UploadResponse } from '@/types';

export default function NewPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    
    try {
      // Create page first
      const createResponse = await fetch('/api/page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title.trim() || undefined }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create page');
      }

      const pageData: CreatePageResponse = await createResponse.json();

      // Upload file
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('pageId', pageData.id);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadData: UploadResponse = await uploadResponse.json();

      showToast('success', 'Image uploaded successfully!');
      
      // Redirect to edit page
      router.push(`/edit/${pageData.slug}?token=${pageData.edit_token}`);
    } catch (error) {
      console.error('Upload error:', error);
      showToast('error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Tool-Tipper
            </h1>
            <p className="text-gray-600">
              Upload an image and add interactive tooltips to share with others
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your image a title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                disabled={uploading}
              />
            </div>

            {!selectedFile ? (
              <UploadDropzone onFileSelect={handleFileSelect} disabled={uploading} />
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={uploading}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>Upload & Continue</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {ToastComponent && (
          <div className="fixed top-4 right-4 z-50 min-w-96">
            {ToastComponent}
          </div>
        )}
      </div>
    </div>
  );
}