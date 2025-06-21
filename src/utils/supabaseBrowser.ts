import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // runtime env check removed after debugging to avoid extra renders

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} 