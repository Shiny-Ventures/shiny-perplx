'use client';

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLocalhost, setIsLocalhost] = useState(false)

  useEffect(() => {
    // Check if running on localhost
    setIsLocalhost(
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    )
  }, [])

  useEffect(() => {
    // Skip auth check if running on localhost
    if (isLocalhost) {
      return;
    }

    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router, isLocalhost])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Allow access on localhost even without user
  if (!user && !isLocalhost) {
    return null
  }

  return <>{children}</>
} 