import { createClient } from '@supabase/supabase-js'

let supabase = null

try {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
  if (url && key && url.startsWith('https://')) {
    supabase = createClient(url, key)
  }
} catch {
  supabase = null
}

export { supabase }
