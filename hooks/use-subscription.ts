'use client';

import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export type SubscriptionTier = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid'

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
          .select('status')
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

        const status = data.status as SubscriptionStatus
        setTier(['active', 'trialing'].includes(status) ? 'pro' : 'free')
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