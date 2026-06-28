import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'pkce' },
});

// Mirror the Supabase session into krew_token so every existing isLoggedIn()
// check (which reads localStorage) stays accurate for new Supabase Auth users.
// Fires on: SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT, and initial session load.
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) {
      localStorage.setItem('krew_token', session.access_token);
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('krew_token');
      localStorage.removeItem('krew_refresh_token');
    }
  });
}
