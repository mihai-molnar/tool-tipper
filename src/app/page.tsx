import Link from 'next/link';
import { Upload } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tool-Tipper</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Create interactive image tooltips that you can share with anyone
          </p>
        </div>
        
        <Link
          href="/new"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium cursor-pointer min-h-[48px]"
        >
          <Upload className="w-5 h-5 mr-2" />
          Create New
        </Link>
      </div>
    </div>
  );
}
