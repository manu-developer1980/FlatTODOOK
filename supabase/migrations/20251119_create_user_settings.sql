CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  notifications JSONB DEFAULT '{}'::jsonb,
  privacy JSONB DEFAULT '{}'::jsonb,
  appearance JSONB DEFAULT '{}'::jsonb,
  language JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (patient_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_read_own ON user_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p WHERE p.id = user_settings.patient_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY user_settings_insert_own ON user_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients p WHERE p.id = user_settings.patient_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY user_settings_update_own ON user_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM patients p WHERE p.id = user_settings.patient_id AND p.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;
GRANT SELECT ON user_settings TO anon;

CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_user_settings_updated_at ON user_settings;
CREATE TRIGGER trg_update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();