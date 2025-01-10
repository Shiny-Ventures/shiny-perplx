'use client'

// Move your existing PricingPage component here and accept props
interface PricingClientProps {
  monthlyPriceId: string
  yearlyPriceId: string
}

export function PricingClient({ monthlyPriceId, yearlyPriceId }: PricingClientProps) {
  // Your existing component code, but use the props instead of env variables
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
        credentials: 'include',
        body: JSON.stringify({
          priceId,
        }),
      })
      // ... rest of the code
    }
  }

  return (
    // ... your existing JSX, but use props
    <Button 
      onClick={() => handleUpgrade(isYearly ? yearlyPriceId : monthlyPriceId)}
      disabled={tier === 'pro'}
    >
      {tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
    </Button>
  )
} 