import { Router } from 'express'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Obtener __dirname equivalente en ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar variables de entorno desde el directorio api/
config({ path: join(__dirname, '..', '.env') })

const router = Router()

// Configuración de Stripe y Supabase
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Precios de Stripe
const PRICE_IDS = {
  premium: 'price_1ST2LIEoOyqILXNqZjtw7oLm', // Premium mensual
  free: 'price_1ST2K0EoOyqILXNqTyTkxbO1'     // Free
}

/**
 * Obtener la suscripción actual del usuario
 */
router.get('/subscription', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    // Obtener suscripción del usuario
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error obteniendo suscripción:', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }

    // Si no existe, crear suscripción gratuita
    if (!subscription) {
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      
      const { data: newSubscription, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: 'free',
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creando suscripción gratuita:', createError)
        return res.status(500).json({ error: 'Error creando suscripción' })
      }

      return res.json({ subscription: newSubscription })
    }

    res.json({ subscription })
  } catch (error) {
    console.error('Error en /subscription:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

/**
 * Crear sesión de checkout para cambiar a premium
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    // Obtener o crear customer de Stripe
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      // Crear customer en Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      })
      customerId = customer.id

      // Actualizar en Supabase
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: PRICE_IDS.premium,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.VITE_APP_URL}/settings?success=true`,
      cancel_url: `${process.env.VITE_APP_URL}/settings?canceled=true`,
      metadata: {
        userId: user.id
      }
    })

    res.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creando sesión de checkout:', error)
    res.status(500).json({ error: 'Error creando sesión de pago' })
  }
})

/**
 * Cancelar suscripción premium
 */
router.post('/cancel-subscription', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    // Obtener suscripción actual
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' })
    }

    if (subscription.plan !== 'premium' || !subscription.stripe_subscription_id) {
      return res.status(400).json({ error: 'No tienes una suscripción premium activa' })
    }

    // Cancelar en Stripe (al final del período)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    })

    // Actualizar en Supabase
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        status: 'canceled'
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando suscripción:', updateError)
      return res.status(500).json({ error: 'Error actualizando suscripción' })
    }

    res.json({ subscription: updatedSubscription })
  } catch (error) {
    console.error('Error cancelando suscripción:', error)
    res.status(500).json({ error: 'Error cancelando suscripción' })
  }
})

/**
 * Webhook de Stripe para actualizar suscripciones
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !endpointSecret) {
    return res.status(400).json({ error: 'Faltan headers de Stripe' })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).json({ error: 'Firma inválida' })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancellation(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          await handleSubscriptionUpdate(subscription)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          await handlePaymentFailure(invoice)
        }
        break
      }

      default:
        console.log(`Evento no manejado: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Error procesando webhook:', error)
    res.status(500).json({ error: 'Error procesando webhook' })
  }
})

/**
 * Manejar actualización de suscripción desde Stripe
 */
async function handleSubscriptionUpdate(stripeSubscription: Stripe.Subscription) {
  const customerId = stripeSubscription.customer as string
  const subscriptionId = stripeSubscription.id

  // Obtener user_id desde metadata del customer
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const userId = customer.metadata.userId

  if (!userId) {
    console.error('No se encontró userId en metadata del customer')
    return
  }

  const priceId = stripeSubscription.items.data[0]?.price.id
  const plan = priceId === PRICE_IDS.premium ? 'premium' : 'free'
  const status = stripeSubscription.status

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      plan,
      status,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end
    }, {
      onConflict: 'user_id'
    })

  if (error) {
    console.error('Error actualizando suscripción:', error)
  }
}

/**
 * Manejar cancelación de suscripción
 */
async function handleSubscriptionCancellation(stripeSubscription: Stripe.Subscription) {
  const customerId = stripeSubscription.customer as string
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const userId = customer.metadata.userId

  if (!userId) {
    console.error('No se encontró userId en metadata del customer')
    return
  }

  // Cambiar a plan gratuito
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'canceled',
      stripe_price_id: PRICE_IDS.free,
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
      cancel_at_period_end: false
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error cancelando suscripción:', error)
  }
}

/**
 * Manejar fallo de pago
 */
async function handlePaymentFailure(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const customerId = subscription.customer as string
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const userId = customer.metadata.userId

  if (!userId) return

  // Marcar suscripción como past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('user_id', userId)

  if (error) {
    console.error('Error actualizando estado por fallo de pago:', error)
  }
}

export default router