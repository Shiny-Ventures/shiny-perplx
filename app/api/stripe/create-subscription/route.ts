import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    // 1) Read the request body: just priceId
    const { priceId } = await request.json()

    // 2) Ensure user is logged in
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401 }
      )
    }
    const userId = session.user.id

    // 3) Retrieve existing stripe_customer_id, if any
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    const stripeCustomerId = data?.stripe_customer_id

    // 4) Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2023-10-16',
    })

    // 5) Create or reuse the Stripe Customer
    let customerId = stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email, // set the user’s email
        metadata: { supabaseUserId: userId },
      })

      customerId = customer.id

      // 6) Save the new customer ID
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      if (updateError) {
        throw new Error(updateError.message)
      }
    }

    // 7) Create or update the subscription (add payment_behavior, payment_settings, metadata)
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      metadata: { supabaseUserId: userId },
      expand: ['latest_invoice.payment_intent'],
    })

    // 9) Upsert subscription row in your "subscriptions" table so that
    //    the user’s local subscription status is tracked as soon as it’s created.
    //    This helps when handling subscription updates in the webhook as well.
    const { error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        status: 'active', // or 'incomplete' if you want to wait for payment
        tier: 'pro', // or ‘free’ if you handle that differently
      })
      .eq('stripe_subscription_id', subscription.id);

    if (upsertError) {
      console.error('Error upserting subscription record:', upsertError);
    }

    // 8) Return subscription data, including clientSecret
    const invoice =
      subscription.latest_invoice &&
      typeof subscription.latest_invoice !== 'string'
        ? (subscription.latest_invoice as Stripe.Invoice)
        : null

    // If the invoice is present, payment_intent could be string or PaymentIntent. Type-guard it:
    let clientSecret: string | null = null
    if (invoice?.payment_intent && typeof invoice.payment_intent !== 'string') {
      // Now it's safe to access payment_intent.client_secret
      clientSecret = (invoice.payment_intent as Stripe.PaymentIntent).client_secret ?? null
    }

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret,
      }),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Create-subscription error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    })
  }
} 