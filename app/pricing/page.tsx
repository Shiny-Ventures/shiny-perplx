'use client';

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSubscription } from '@/hooks/use-subscription'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function PricingPage() {
  const { tier, loading } = useSubscription()
  const { user } = useAuth()
  const router = useRouter()

  const handleUpgrade = async () => {
    if (!user) {
      toast.error('Please sign in to upgrade')
      router.push('/login')
      return
    }

    // TODO: Implement your payment flow here
    toast.info('Payment flow coming soon!')
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose the plan that best fits your needs
        </p>
      </div>

      <div className="mt-12 grid gap-8 max-w-5xl mx-auto sm:grid-cols-2">
        {/* Free Tier */}
        <Card className={`p-8 ${tier === 'free' ? 'border-blue-500' : ''}`}>
          <div className="flex flex-col h-full">
            <h3 className="text-2xl font-bold">Free</h3>
            <p className="mt-4 text-muted-foreground flex-grow">
              Perfect for trying out our service
            </p>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="mt-6 space-y-4">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                3 queries per day
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Basic support
              </li>
            </ul>
            <Button 
              className="mt-8" 
              variant="outline"
              disabled={tier === 'free'}
            >
              {tier === 'free' ? 'Current Plan' : 'Downgrade'}
            </Button>
          </div>
        </Card>

        {/* Pro Tier */}
        <Card className={`p-8 ${tier === 'pro' ? 'border-blue-500' : ''}`}>
          <div className="flex flex-col h-full">
            <h3 className="text-2xl font-bold">Pro</h3>
            <p className="mt-4 text-muted-foreground flex-grow">
              For power users who need more
            </p>
            <div className="mt-4">
              <span className="text-4xl font-bold">$10</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="mt-6 space-y-4">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Unlimited queries
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Priority support
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Advanced features
              </li>
            </ul>
            <Button 
              className="mt-8" 
              variant="default"
              onClick={handleUpgrade}
              disabled={tier === 'pro'}
            >
              {tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
} 