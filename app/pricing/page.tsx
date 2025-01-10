import { PricingClient } from './pricing-client'

export default function PricingPage() {
  return (
    <PricingClient 
      monthlyPriceId={process.env.STRIPE_PRO_PRICE_ID!}
      yearlyPriceId={process.env.STRIPE_PRO_YEARLY_PRICE_ID!}
    />
  )
} 