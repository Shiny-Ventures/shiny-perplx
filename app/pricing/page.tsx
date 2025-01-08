'use client';

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSubscription } from '@/hooks/use-subscription'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'

export default function PricingPage() {
  const { tier, loading } = useSubscription()
  const { user } = useAuth()
  const router = useRouter()
  const [isYearly, setIsYearly] = useState(false)

  const handleUpgrade = async (priceId: string) => {
    if (!user) {
      toast.error('Please sign in to upgrade')
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error('Failed to start checkout process')
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Error starting checkout:', error)
      toast.error('Failed to start checkout process')
    }
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
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className={!isYearly ? 'font-semibold' : 'text-muted-foreground'}>Monthly</span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <span className={isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Yearly <span className="text-green-500 text-sm">(Save ~17%)</span>
          </span>
        </div>
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
              <span className="text-4xl font-bold">
                ${isYearly ? '200' : '20'}
              </span>
              <span className="text-muted-foreground">
                /{isYearly ? 'year' : 'month'}
              </span>
              {isYearly && (
                <div className="text-green-500 text-sm mt-1">
                  ~$16.67/month, billed annually
                </div>
              )}
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
              onClick={() => handleUpgrade(isYearly ? process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID! : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!)}
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