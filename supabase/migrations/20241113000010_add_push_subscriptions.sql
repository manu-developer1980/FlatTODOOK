-- ====================
-- PUSH SUBSCRIPTIONS TABLE
-- ====================
CREATE TABLE user_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for push subscriptions
ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own push subscriptions
CREATE POLICY "Users can view own push subscriptions" ON user_push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own push subscriptions
CREATE POLICY "Users can insert own push subscriptions" ON user_push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own push subscriptions
CREATE POLICY "Users can update own push subscriptions" ON user_push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own push subscriptions
CREATE POLICY "Users can delete own push subscriptions" ON user_push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Index for efficient lookup by user_id
CREATE INDEX idx_user_push_subscriptions_user_id ON user_push_subscriptions(user_id);

-- Index for efficient lookup by subscription data
CREATE INDEX idx_user_push_subscriptions_subscription ON user_push_subscriptions USING GIN (subscription);