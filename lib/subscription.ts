import { createClient } from '@supabase/supabase-js'
import { SubscriptionTier } from '@/hooks/use-subscription'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    // Return 'pro' only if subscription exists and is active
    if (data && data.status === 'active' && data.tier === 'pro') {
      return 'pro'
    }

    return 'free'
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return 'free' // Default to free tier on error
  }
}

export async function updateUserSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  tier: SubscriptionTier,
  status: string
) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        tier,
        status: status as any,
      })

    if (error) throw error
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
} 