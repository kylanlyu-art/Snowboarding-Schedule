import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null

if (url && anonKey) {
  client = createClient(url, anonKey)
}

export const supabase = client

/** 是否已配置 Supabase（可用于决定是否显示「登录 / 同步」等） */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}
