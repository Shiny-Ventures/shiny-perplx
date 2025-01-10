'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSubscription } from '@/hooks/use-subscription'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { loadStripe } from '@stripe/stripe-js'
import { Loader2 } from 'lucide-react'

interface PricingClientProps {
  monthlyPriceId: string
  yearlyPriceId: string
}

export function PricingClient({ monthlyPriceId, yearlyPriceId }: PricingClientProps) {
  const { tier, loading } = useSubscription()
  const { user } = useAuth()
  const router = useRouter()
  const [isYearly, setIsYearly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async (priceId: string) => {
    if (!user) {
      toast.error('Please sign in to upgrade')
      router.push('/login')
      return
    }

    setIsLoading(true)

    try {
      // First try to create a subscription
      const subscriptionResponse = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          priceId,
        }),
      })

      if (subscriptionResponse.ok) {
        // If successful, get the client secret and redirect to checkout
        const { clientSecret } = await subscriptionResponse.json()
        
        // Initialize Stripe
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        
        if (!stripe) {
          throw new Error('Failed to load Stripe')
        }

        // Redirect to Stripe's hosted payment page
        const { error } = await stripe.confirmCardPayment(clientSecret)
        if (error) {
          throw new Error(error.message)
        }

        // On successful payment, redirect to success page
        router.push('/payment/success')
      } else {
        // If subscription creation fails, fall back to checkout session
        const checkoutResponse = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            priceId,
          }),
        })

        if (!checkoutResponse.ok) {
          const errorData = await checkoutResponse.json()
          throw new Error(errorData.error || 'Failed to start checkout process')
        }

        const data = await checkoutResponse.json()
        
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error('No checkout URL received')
        }
      }
    } catch (error) {
      console.error('Error starting checkout:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout process')
    } finally {
      setIsLoading(false)
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
              onClick={() => handleUpgrade(isYearly ? yearlyPriceId : monthlyPriceId)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
} 