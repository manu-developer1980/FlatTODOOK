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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)
    const stripe = new Stripe(stripeSecret)

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single()
    if (!sub?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: 'No subscription' }), { status: 400, headers: corsHeaders })
    }

    await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true })
    const updated = await supabase.from('subscriptions').update({ cancel_at_period_end: true }).eq('user_id', user.id).select().single()
    return new Response(JSON.stringify({ subscription: updated.data }), { headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to cancel' }), { status: 500, headers: corsHeaders })
  }
}