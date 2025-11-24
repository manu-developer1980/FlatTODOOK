import Stripe from 'https://esm.sh/stripe@12.17.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

export default async function (req: Request): Promise<Response> {
  const origin = req.headers.get('origin') || '*'
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  }
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
    const priceId = Deno.env.get('PRICE_PREMIUM')
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5174'

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase env' }), { status: 500, headers: corsHeaders })
    }
    if (!stripeSecret || !priceId) {
      return new Response(JSON.stringify({ error: 'Missing Stripe env (STRIPE_SECRET_KEY or PRICE_PREMIUM)' }), { status: 500, headers: corsHeaders })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const stripe = new Stripe(stripeSecret)

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { data: existing } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single()

    let customerId = existing?.stripe_customer_id as string | undefined
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email || undefined })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/settings?checkout=success`,
      cancel_url: `${siteUrl}/settings?checkout=cancel`,
    })

    if (!existing) {
      const now = new Date().toISOString()
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        status: 'active',
        plan: 'free',
        current_period_start: now,
        current_period_end: now,
        cancel_at_period_end: false,
        stripe_customer_id: customerId,
      })
    } else {
      await supabase.from('subscriptions').update({ stripe_customer_id: customerId }).eq('user_id', user.id)
    }

    return new Response(JSON.stringify({ sessionId: session.id }), { headers: corsHeaders })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Failed to create session', detail: e?.message || String(e) }), { status: 500, headers: corsHeaders })
  }
}