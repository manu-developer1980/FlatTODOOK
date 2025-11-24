-- Create table for web push subscriptions
CREATE TABLE web_push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_web_push_subscriptions_user_id ON web_push_subscriptions(user_id);
CREATE INDEX idx_web_push_subscriptions_endpoint ON web_push_subscriptions(endpoint);

-- Enable RLS
ALTER TABLE web_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only read their own subscriptions
CREATE POLICY "Users can view own push subscriptions" 
    ON web_push_subscriptions FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can only insert/update their own subscriptions
CREATE POLICY "Users can manage own push subscriptions" 
    ON web_push_subscriptions FOR ALL 
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON web_push_subscriptions TO authenticated;
GRANT INSERT ON web_push_subscriptions TO authenticated;
GRANT UPDATE ON web_push_subscriptions TO authenticated;
GRANT DELETE ON web_push_subscriptions TO authenticated;

-- Grant permissions for service role (backend)
GRANT ALL ON web_push_subscriptions TO service_role;