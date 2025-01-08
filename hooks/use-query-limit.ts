'use client';

import { useAuth } from '@/contexts/auth-context'
import { hasExceededDailyLimit, trackQuery } from '@/lib/supabase'
import { useState } from 'react'
import { useSubscription } from './use-subscription'

export function useQueryLimit() {
  const { user } = useAuth()
  const { isProUser } = useSubscription()
  const [isExceeded, setIsExceeded] = useState(false)

  const checkAndTrackQuery = async (queryDetails: any) => {
    if (!user?.id) {
      throw new Error('User must be logged in to make queries')
    }

    // Pro users have unlimited queries
    if (isProUser) {
      await trackQuery(user.id, queryDetails)
      return true
    }

    const exceeded = await hasExceededDailyLimit(user.id)
    setIsExceeded(exceeded)

    if (exceeded) {
      throw new Error('Daily query limit exceeded. Please upgrade to continue.')
    }

    await trackQuery(user.id, queryDetails)
    return true
  }

  return {
    isExceeded,
    checkAndTrackQuery,
    isAuthenticated: !!user,
    isProUser
  }
} 