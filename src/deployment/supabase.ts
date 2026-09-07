const SUPABASE_URL = 'https://jnbppgjkzzuquhenaqtq.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0wnc_Y6ccYUsA78VGjmOKw_d0zTig_V'
const SUPABASE_ESM = 'https://esm.sh/@supabase/supabase-js@2.57.4'

export type ArcSupabaseClient = {
  auth: {
    getSession: () => Promise<{ data: { session: any | null }, error?: unknown }>
    signInWithOAuth: (args: any) => Promise<{ error: any | null }>
    exchangeCodeForSession: (code: string) => Promise<{ error: any | null }>
    signOut: () => Promise<{ error: any | null }>
    onAuthStateChange: (callback: (event: string, session: any | null) => void) => { data: { subscription: { unsubscribe: () => void } } }
  }
  from: (table: string) => any
}

let clientPromise: Promise<ArcSupabaseClient> | null = null

export function loadArcSupabase(): Promise<ArcSupabaseClient> {
  if (!clientPromise) {
    const importModule = new Function('url', 'return import(url)') as (url: string) => Promise<any>
    clientPromise = importModule(SUPABASE_ESM).then(({ createClient }) => createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    ))
  }
  return clientPromise
}

export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY }
