import { supabase } from '@/lib/supabase-client';

/**
 * Make an authenticated API call with the user's session token
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const session = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  // Add authorization header if user is logged in
  if (session.data.session?.access_token) {
    headers.Authorization = `Bearer ${session.data.session.access_token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}