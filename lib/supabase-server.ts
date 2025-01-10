import { createClient } from '@supabase/supabase-js'
import { clientEnv } from '@/env/client'
import { serverEnv } from '@/env/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Admin client for server-side operations
export const supabaseAdmin = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper functions that use supabaseAdmin
export async function hasExceededDailyLimit(userId: string): Promise<boolean> {
  try {
    // First check if user has an active pro subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .single()

    // Pro users with active subscription have unlimited queries
    if (subscription?.tier === 'pro' && subscription?.status === 'active') {
      return false
    }

    // For free tier users, check daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: queries, error } = await supabaseAdmin
      .from('user_queries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())

    if (error) {
      console.error('Error checking query limit:', error)
      return true // Fail safe: assume limit exceeded if there's an error
    }

    return (queries?.length ?? 0) >= 3 // Free tier limit
  } catch (error) {
    console.error('Error checking subscription and query limit:', error)
    return true // Fail safe: assume limit exceeded if there's an error
  }
}

export async function trackQuery(userId: string, queryDetails: any) {
  const { error } = await supabaseAdmin
    .from('user_queries')
    .insert([
      {
        user_id: userId,
        query_details: queryDetails,
      },
    ])

  if (error) {
    console.error('Error tracking query:', error)
  }
}

// If you use server components, you might follow the pattern below:
export function createSupabaseServerClient() {
  return createServerComponentClient({ cookies })
} 