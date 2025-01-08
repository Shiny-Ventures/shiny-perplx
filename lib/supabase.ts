import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if user has exceeded free tier limit
export async function hasExceededDailyLimit(userId: string): Promise<boolean> {
  try {
    // First check if user has an active pro subscription
    const { data: subscription } = await supabase
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

    const { data: queries, error } = await supabase
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

// Helper function to track a new query
export async function trackQuery(userId: string, queryDetails: any) {
  const { error } = await supabase
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