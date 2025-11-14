-- Tabla de suscripciones
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')) DEFAULT 'active',
  plan TEXT CHECK (plan IN ('free', 'premium')) DEFAULT 'free',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices únicos
CREATE UNIQUE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE UNIQUE INDEX subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE UNIQUE INDEX subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);

-- RLS para suscripciones
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias suscripciones
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden actualizar cancel_at_period_end de su propia suscripción
CREATE POLICY "Users can update own subscription cancel status" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Solo el servicio puede crear/actualizar suscripciones completas
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();