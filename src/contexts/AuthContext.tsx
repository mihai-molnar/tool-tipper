'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  plan_type: 'free' | 'pro';
  subscription_id?: string;
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  created_at: string;
  updated_at: string;
}

export interface UserUsage {
  total_hotspots: number;
  total_pages: number;
  last_updated: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  usage: UserUsage | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGitHub: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  canCreateHotspot: () => boolean;
  getRemainingHotspots: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle missing records

      if (error) {
        // If table doesn't exist, create a fallback profile
        if (error.code === 'PGRST205') {
          console.warn('user_profiles table not found. Run database/auth-schema.sql');
          setProfile({
            id: userId,
            email: user?.email || '',
            plan_type: 'free' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          return;
        }
        throw error;
      }

      // If no profile exists for this user, create a default one
      if (!data) {
        console.log('No profile found for user, creating default');
        setProfile({
          id: userId,
          email: user?.email || '',
          plan_type: 'free' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return;
      }

      setProfile(data);
    } catch (error) {
      // Suppress table not found errors - expected until auth schema is run
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST205') {
        console.error('Error fetching profile:', error);
      }
      // Create fallback profile even on error
      setProfile({
        id: userId,
        email: user?.email || '',
        plan_type: 'free' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };

  // Fetch user usage
  const fetchUsage = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle missing records

      if (error) {
        // If table doesn't exist, create a fallback usage
        if (error.code === 'PGRST205') {
          console.warn('user_usage table not found. Run database/auth-schema.sql');
          setUsage({
            total_hotspots: 0,
            total_pages: 0,
            last_updated: new Date().toISOString(),
          });
          return;
        }
        throw error;
      }

      // If no usage record exists for this user, create a default one
      if (!data) {
        console.log('No usage record found for user, creating default');
        setUsage({
          total_hotspots: 0,
          total_pages: 0,
          last_updated: new Date().toISOString(),
        });
        return;
      }

      setUsage(data);
    } catch (error) {
      // Suppress table not found errors - expected until auth schema is run
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST205') {
        console.error('Error fetching usage:', error);
      }
      setUsage({
        total_hotspots: 0,
        total_pages: 0,
        last_updated: new Date().toISOString(),
      });
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Refresh usage
  const refreshUsage = async () => {
    if (user) {
      await fetchUsage(user.id);
    }
  };

  // Check if user can create hotspot
  const canCreateHotspot = () => {
    if (!user || !profile || !usage) return true; // Allow anonymous users
    
    if (profile.plan_type === 'pro') return true;
    
    return usage.total_hotspots < 10; // Free tier limit
  };

  // Get remaining hotspots for free users
  const getRemainingHotspots = () => {
    if (!user || !profile || !usage) return 10; // Anonymous users get 10
    
    if (profile.plan_type === 'pro') return Infinity;
    
    return Math.max(0, 10 - usage.total_hotspots);
  };

  // Sign up
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Try Supabase sign out with timeout
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timeout')), 3000);
      });
      
      await Promise.race([signOutPromise, timeoutPromise]);
      
      // Clear local state
      setUser(null);
      setProfile(null);
      setUsage(null);
      setSession(null);
      
      return { error: null };
    } catch (error) {
      // Even if Supabase fails, clear local state
      setUser(null);
      setProfile(null);
      setUsage(null);
      setSession(null);
      
      return { error: null }; // Return success since we cleared local state
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Sign in with GitHub
  const signInWithGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchUsage(session.user.id),
          ]);
        } else {
          // For anonymous users, set null states immediately
          setProfile(null);
          setUsage(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
        setProfile(null);
        setUsage(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchUsage(session.user.id),
          ]);
        } else {
          setProfile(null);
          setUsage(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    usage,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithGitHub,
    refreshProfile,
    refreshUsage,
    canCreateHotspot,
    getRemainingHotspots,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};