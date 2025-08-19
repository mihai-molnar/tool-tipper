'use client';

import Link from 'next/link';
import { Upload, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

export default function Home() {
  const { user, profile, usage, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 pt-16">
      <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {user ? `Welcome back!` : 'Tool-Tipper'}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {user 
              ? 'Ready to create more interactive images?'
              : 'Create interactive image tooltips that you can share with anyone'
            }
          </p>
        </div>

        {/* Usage Stats for Logged In Users */}
        {user && usage && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{usage.total_hotspots}</span>
                <span className="text-gray-600">hotspots</span>
              </div>
              <div className="flex items-center space-x-1">
                <Upload className="w-4 h-4 text-green-600" />
                <span className="font-medium">{usage.total_pages}</span>
                <span className="text-gray-600">projects</span>
              </div>
            </div>
            {profile?.plan_type === 'free' && (
              <div className="mt-2 text-xs text-gray-500">
                {Math.max(0, 10 - usage.total_hotspots)} free hotspots remaining
              </div>
            )}
            {/* Debug info - remove in production */}
            <div className="mt-1 text-xs text-gray-400">
              Debug: User {user.id.slice(0, 8)}..., Plan: {profile?.plan_type || 'unknown'}
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <Link
            href="/new"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium cursor-pointer min-h-[48px]"
          >
            <Upload className="w-5 h-5 mr-2" />
            Create New
          </Link>
          
          {!user && (
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
          )}

          {user && profile?.plan_type === 'free' && (
            <Link
              href="/upgrade"
              className="inline-flex items-center justify-center w-full px-4 py-2 text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50 transition-colors font-medium cursor-pointer min-h-[44px]"
            >
              Upgrade to Pro
            </Link>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
