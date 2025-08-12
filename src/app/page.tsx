import Link from 'next/link';
import { Upload } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Tool-Tipper</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Create interactive image tooltips that you can share with anyone
          </p>
        </div>
        
        <div className="space-y-3">
          <Link
            href="/new"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium cursor-pointer min-h-[48px]"
          >
            <Upload className="w-5 h-5 mr-2" />
            Create New
          </Link>
          
          <div className="flex space-x-3">
            <Link
              href="/auth/login"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium cursor-pointer min-h-[44px]"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium cursor-pointer min-h-[44px]"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
