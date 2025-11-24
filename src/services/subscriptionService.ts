import { supabase } from '@/lib/supabase'

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_price_id?: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  plan: 'free' | 'premium'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface CheckoutSession {
  sessionId: string
}

export class SubscriptionService {
  /**
   * Obtener la suscripción actual del usuario
   */
  static async getSubscription(): Promise<Subscription | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        // If no subscription exists, create a free one
        if (error.code === 'PGRST116') {
          console.log('No subscription found, creating free subscription for user:', session.user.id)
          return await this.createFreeSubscription(session.user.id)
        }
        console.error('Error obteniendo suscripción:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error en getSubscription:', error)
      return null
    }
  }

  /**
   * Create a free subscription for a new user
   */
  static async createFreeSubscription(userId: string): Promise<Subscription | null> {
    try {
      const now = new Date()
      const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'active',
          plan: 'free',
          current_period_start: now.toISOString(),
          current_period_end: oneYearFromNow.toISOString(),
          cancel_at_period_end: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating free subscription:', error)
        return null
      }

      console.log('Free subscription created successfully for user:', userId)
      return data
    } catch (error) {
      console.error('Error in createFreeSubscription:', error)
      return null
    }
  }

  /**
   * Crear sesión de checkout para premium
   */
  static async createCheckoutSession(): Promise<CheckoutSession | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const edgeBase = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
      const response = await fetch(`${edgeBase}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string
        }
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Error creando sesión de checkout: ${text}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error creando checkout session:', error)
      return null
    }
  }

  /**
   * Cancelar suscripción premium
   */
  static async cancelSubscription(): Promise<Subscription | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const edgeBase = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
      const response = await fetch(`${edgeBase}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string
        }
      })

      if (!response.ok) {
        throw new Error('Error cancelando suscripción')
      }

      const data = await response.json()
      return data.subscription
    } catch (error) {
      console.error('Error cancelando suscripción:', error)
      return null
    }
  }

  /**
   * Verificar si el usuario tiene premium
   */
  static async hasPremium(): Promise<boolean> {
    const subscription = await this.getSubscription()
    return subscription?.plan === 'premium' && subscription?.status === 'active'
  }

  /**
   * Escuchar cambios en la suscripción
   */
  static subscribeToSubscriptionChanges(userId: string, callback: (subscription: Subscription) => void) {
    return supabase
      .channel(`subscription:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Subscription)
        }
      )
      .subscribe()
  }
}