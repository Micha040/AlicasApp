import { supabase } from '../supabaseClient';

export async function getCurrentUserFromOwnTable() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', session.user.id)
      .single();
    return userData;
  }
  return null;
} 