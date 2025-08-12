'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { ReactNode, useState, useRef, useEffect } from 'react';

interface HeaderProps {
  title?: string;
  onTitleEdit?: () => void;
  isEditingTitle?: boolean;
  actions?: ReactNode;
}

export default function Header({ title, onTitleEdit, isEditingTitle, actions }: HeaderProps) {
  const { user, profile, loading, signOut } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const authDropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    setShowUserDropdown(false);
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      // Always redirect regardless of error since we clear local state
      window.location.href = '/';
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
      // Force redirect even on error
      window.location.href = '/';
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (authDropdownRef.current && !authDropdownRef.current.contains(event.target as Node)) {
        setShowAuthDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full space-x-4">
          {/* Left: Branding + Title */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Tool-Tipper
                </span>
              </Link>
            </div>

            {/* Title */}
            {title && (
              <>
                <span className="text-gray-300 hidden sm:inline">/</span>
                <div className="min-w-0 flex-1">
                  {isEditingTitle ? (
                    <div className="min-w-0">
                      {/* Title editing will be handled by parent component */}
                      <span className="text-lg font-semibold text-gray-900">Editing...</span>
                    </div>
                  ) : (
                    <h1 
                      className={`text-base sm:text-lg font-semibold text-gray-900 truncate ${onTitleEdit ? 'cursor-pointer hover:text-gray-700 transition-colors' : ''}`}
                      onClick={onTitleEdit}
                      title={onTitleEdit ? "Click to edit title" : undefined}
                    >
                      {title}
                    </h1>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: Actions + User Section */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Custom Actions */}
            {actions && <div className="flex items-center space-x-2">{actions}</div>}

            {/* User Section */}
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                {/* User Button */}
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 px-2 py-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm text-left hidden sm:block">
                    <div className="font-medium text-gray-900">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {profile?.plan_type || 'free'} plan
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100 sm:hidden">
                        <div className="font-medium text-gray-900">
                          {profile?.full_name || user.email?.split('@')[0]}
                        </div>
                        <div className="text-xs capitalize">
                          {profile?.plan_type || 'free'} plan
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : !loading ? (
              <div className="relative" ref={authDropdownRef}>
                {/* Auth Button */}
                <button
                  onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Account</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Auth Dropdown */}
                {showAuthDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <Link
                        href="/auth/login"
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => setShowAuthDropdown(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => setShowAuthDropdown(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}