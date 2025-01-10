'use client';

import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export type SubscriptionTier = 'free' | 'pro'

export function useSubscription() {
  const { user } = useAuth()
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
          .single()

        if (error || !data) {
          setTier('free')
        } else {
          setTier(data.status === 'active' ? 'pro' : 'free')
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
        setTier('free')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user?.id])

  return {
    tier,
    loading,
    isProUser: tier === 'pro'
  }
} 