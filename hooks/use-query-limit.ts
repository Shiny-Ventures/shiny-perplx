'use client';

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/auth-context'

export function useQueryLimit() {
  const { user } = useAuth()
  const [hasReachedLimit, setHasReachedLimit] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkLimit = useCallback(async () => {
    if (!user) {
      setHasReachedLimit(false)
      setLoading(false)
      return false
    }

    try {
      // First check if user has an active pro subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', user.id)
        .single()

      // Pro users with active subscription have unlimited queries
      if (subscription?.tier === 'pro' && subscription?.status === 'active') {
        setHasReachedLimit(false)
        setLoading(false)
        return false
      }

      // For free tier users, check daily limit
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: queries, error } = await supabase
        .from('user_queries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())

      if (error) {
        console.error('Error checking query limit:', error)
        setHasReachedLimit(true)
        return true
      }

      const hasReached = (queries?.length ?? 0) >= 3
      setHasReachedLimit(hasReached)
      return hasReached
    } catch (error) {
      console.error('Error checking subscription and query limit:', error)
      setHasReachedLimit(true)
      return true
    } finally {
      setLoading(false)
    }
  }, [user])

  const checkAndTrackQuery = useCallback(async (queryDetails: any) => {
    if (!user) return false

    const hasReached = await checkLimit()
    if (hasReached) return false

    try {
      // Track the query
      const { error } = await supabase
        .from('user_queries')
        .insert([
          {
            user_id: user.id,
            query_details: queryDetails,
          },
        ])

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error tracking query:', error)
      return false
    }
  }, [user, checkLimit])

  useEffect(() => {
    checkLimit()
  }, [checkLimit])

  return {
    hasReachedLimit,
    loading,
    checkAndTrackQuery,
    isAuthenticated: !!user
  }
} 