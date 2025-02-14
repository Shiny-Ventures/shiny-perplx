'use client';

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      router.push('/pricing')
    }
  }, [sessionId, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for upgrading to Pro! You now have access to unlimited queries and all premium features.
        </p>
        <Button
          onClick={() => router.push('/')}
          className="w-full"
        >
          Start Using Pro Features
        </Button>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
          </div>
          <h1 className="text-2xl font-bold mt-4">Loading...</h1>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
} 