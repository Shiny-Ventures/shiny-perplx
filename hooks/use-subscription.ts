'use client';

import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export type SubscriptionTier = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid'

interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  tier: string
  status: SubscriptionStatus
  created_at: string
  updated_at: string
}

export function useSubscription() {
  const { user } = useAuth()
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    if (!user?.id) {
      setTier('free')
      setLoading(false)
      return
    }

    async function fetchSubscription() {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('tier, status')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!isMounted) return

        if (error) {
          console.error('Error fetching subscription:', error)
          setTier('free')
          return
        }

        if (!data) {
          setTier('free')
          return
        }

        // Ensure we're using the correct tier from the database
        const subscriptionTier = data.tier as SubscriptionTier
        const subscriptionStatus = data.status as SubscriptionStatus

        // Only set as pro if both tier is 'pro' and status is active/trialing
        setTier(
          subscriptionTier === 'pro' && 
          ['active', 'trialing'].includes(subscriptionStatus) 
            ? 'pro' 
            : 'free'
        )
      } catch (error) {
        if (!isMounted) return
        console.error('Error fetching subscription:', error)
        setTier('free')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSubscription()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  return {
    tier,
    loading,
    isProUser: tier === 'pro'
  }
} 