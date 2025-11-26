import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase Client
 * ===========================
 * გამოიყენება Server Components-ში და generateMetadata-ში
 * არ საჭიროებს cookies-ს, მხოლოდ public data-ს წვდომისთვის
 */
export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
