import Link from 'next/link';
import { Home, Upload } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist. It might have been deleted or you entered the wrong URL.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
          <Link
            href="/new"
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Create New</span>
          </Link>
        </div>
      </div>
    </div>
  );
}