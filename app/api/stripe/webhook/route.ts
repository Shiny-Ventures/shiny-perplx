import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { Readable } from 'stream'

async function readRequestBodyAsBuffer(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) return Buffer.from('')

  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  return Buffer.concat(chunks)
}

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16',
  })

  let event: Stripe.Event

  try {
    const buf = await readRequestBodyAsBuffer(request)
    const signature = request.headers.get('stripe-signature') || ''

    // 1) Construct the event (verify signature)
    event = stripe.webhooks.constructEvent(
      buf,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // 2) Handle the event type
  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      // e.g. invoice.customer is the Stripe customer ID: invoice.customer
      // Update your Supabase row with subscription status
      // ...
      break
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      // Possibly update subscription status in Supabase
      // ...
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      // 1) This is the stripe customer ID
      const customerId = subscription.customer as string;
      const status = subscription.status; // e.g. 'active', 'trialing', etc.

      try {
        // 2) Look up the local user row that matches this stripe_customer_id
        const { data: userSubscription, error } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (error) throw new Error(error.message);

        if (userSubscription) {
          // 3) Decide the new tier
          //    (If you only have 'pro' vs 'free', you can mark 'pro' if status === 'active')
          const newTier = status === 'active' || status === 'trialing' ? 'pro' : 'free';

          // 4) Update the subscription row accordingly
          const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              tier: newTier,
              status: status, // e.g. 'active', 'trialing', 'canceled', etc.
              stripe_subscription_id: subscription.id,
            })
            .eq('stripe_customer_id', customerId);

          if (updateError) {
            console.error('Error updating subscription row:', updateError);
          }
        }
      } catch (err) {
        console.error('Error handling subscription update:', err);
      }
      break;
    }
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // The session contains subscription/customer IDs that we can use.
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;
      const userId = session?.metadata?.supabaseUserId; // Or however the user ID is set in metadata

      try {
        // If needed, create or update the subscription row in your DB
        const { error: upsertError } = await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            tier: 'pro', // or logic to figure out the correct tier
            status: 'active',
          })
          .eq('stripe_customer_id', customerId) // upsert by stripe_customer_id

        if (upsertError) {
          console.error('Error upserting subscription row:', upsertError);
        }
      } catch (err) {
        console.error('Error handling checkout.session.completed:', err);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      try {
        // Mark subscription as canceled
        const { error: cancelError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            tier: 'free',
          })
          .eq('stripe_subscription_id', subscription.id);

        if (cancelError) {
          console.error('Error canceling subscription:', cancelError);
        }
      } catch (err) {
        console.error('Error handling subscription deletion:', err);
      }
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const subscriptionId = paymentIntent.metadata?.subscriptionId; // or however you track it

      if (subscriptionId) {
        try {
          // Mark subscription as active
          const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'active',
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (updateError) {
            console.error('Error updating subscription status:', updateError);
          }
        } catch (err) {
          console.error('Error handling payment_intent.succeeded:', err);
        }
      } else {
        console.log('No subscriptionId metadata found on payment intent');
      }
      break;
    }
    // ... handle other events ...
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true }, { status: 200 })
} 