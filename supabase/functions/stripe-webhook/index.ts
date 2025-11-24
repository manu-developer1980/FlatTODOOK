import Stripe from 'https://esm.sh/stripe@12.17.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

export default async function (req: Request): Promise<Response> {
  const origin = req.headers.get('origin') || '*'
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  }
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const supabase = createClient(supabaseUrl, serviceKey)
  const stripe = new Stripe(stripeSecret)

  try {
    const payload = await req.text()
    const sig = req.headers.get('stripe-signature')!
    const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session: any = event.data.object
        const customerId = session.customer as string
        const subId = session.subscription as string
        const priceId = session.display_items?.[0]?.price?.id || session?.line_items?.[0]?.price?.id
        const { data: subRow } = await supabase.from('subscriptions').select('user_id').eq('stripe_customer_id', customerId).single()
        if (subRow?.user_id) {
          await supabase.from('subscriptions').update({
            plan: 'premium',
            status: 'active',
            stripe_subscription_id: subId,
            stripe_price_id: priceId,
            cancel_at_period_end: false,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }).eq('user_id', subRow.user_id)
        }
        break
      }
      case 'customer.subscription.updated': {
        const subscription: any = event.data.object
        const customerId = subscription.customer as string
        const { data: subRow } = await supabase.from('subscriptions').select('user_id').eq('stripe_customer_id', customerId).single()
        if (subRow?.user_id) {
          await supabase.from('subscriptions').update({
            status: subscription.status === 'active' ? 'active' : subscription.cancel_at_period_end ? 'canceled' : 'unpaid',
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          }).eq('user_id', subRow.user_id)
        }
        break
      }
    }
    return new Response(JSON.stringify({ received: true }), { headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Webhook error' }), { status: 400, headers: corsHeaders })
  }
}