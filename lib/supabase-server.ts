import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Server-side Supabase with service role (bypasses RLS) */
export function createServiceSupabase() {
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Server-side Supabase scoped to a user (respects RLS) */
export function createUserSupabase(accessToken: string) {
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Extract access token from Authorization header */
export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

/** Auth guard — returns user or throws */
export async function requireAuth(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) throw new Error('Unauthorized');
  const supabase = createUserSupabase(token);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return { user, supabase };
}
