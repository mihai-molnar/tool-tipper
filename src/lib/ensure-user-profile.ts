import { supabase } from '@/lib/supabase-client';

/**
 * Ensure a user has a profile in the user_profiles table
 * Creates one if it doesn't exist
 */
export async function ensureUserProfile(userId: string, userEmail?: string): Promise<boolean> {
  try {
    // Check if profile exists
    const { data: existing, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST205') {
      console.error('Error checking user profile:', checkError);
      return false;
    }

    // If profile exists or table doesn't exist, return
    if (existing || checkError?.code === 'PGRST205') {
      return existing !== null;
    }

    // Create profile if it doesn't exist
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email: userEmail || '',
        plan_type: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error creating user profile:', insertError);
      return false;
    }

    console.log('Created user profile for', userId);
    return true;
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return false;
  }
}