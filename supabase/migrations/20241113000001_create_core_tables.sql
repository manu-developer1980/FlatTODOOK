-- MediTrack Core Database Schema
-- Complete implementation according to technical architecture document

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum
CREATE TYPE user_role AS ENUM ('patient', 'caregiver', 'professional');

-- Medication frequency enum
CREATE TYPE medication_frequency AS ENUM ('daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'every_4_hours', 'every_6_hours', 'every_8_hours', 'every_12_hours', 'weekly', 'monthly', 'as_needed');

-- Medication form enum
CREATE TYPE medication_form AS ENUM ('tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 'inhaler', 'drops', 'patch', 'suppository');

-- Dosage unit enum
CREATE TYPE dosage_unit AS ENUM ('mg', 'g', 'ml', 'iu', 'mcg', 'drops', 'puffs', 'units');

-- Intake status enum
CREATE TYPE intake_status AS ENUM ('pending', 'taken', 'missed', 'skipped');

-- Appointment status enum
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'canceled', 'no_show');

-- Notification type enum
CREATE TYPE notification_type AS ENUM ('medication_reminder', 'appointment_reminder', 'refill_reminder', 'system_alert');

-- ====================
-- PATIENTS TABLE
-- ====================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    phone_number TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_conditions TEXT[],
    allergies TEXT[],
    preferred_language TEXT DEFAULT 'es',
    timezone TEXT DEFAULT 'Europe/Madrid',
    profile_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- RLS Policies for patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Users can read their own patient record
CREATE POLICY "Users can view own patient record" ON patients
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own patient record
CREATE POLICY "Users can update own patient record" ON patients
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own patient record
CREATE POLICY "Users can insert own patient record" ON patients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ====================
-- MEDICATIONS TABLE
-- ====================
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    generic_name TEXT NOT NULL,
    brand TEXT,
    strength TEXT,
    form medication_form NOT NULL DEFAULT 'tablet',
    dosage TEXT NOT NULL,
    frequency medication_frequency NOT NULL,
    specific_times TIME[],
    start_date DATE NOT NULL,
    end_date DATE,
    instructions TEXT,
    prescribed_by TEXT,
    pharmacy_name TEXT,
    pharmacy_phone TEXT,
    refill_quantity INTEGER,
    refill_remaining INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for medications
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- Users can read medications for their patient record
CREATE POLICY "Users can view own medications" ON medications
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Users can insert medications for their patient record
CREATE POLICY "Users can insert own medications" ON medications
    FOR INSERT WITH CHECK (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Users can update medications for their patient record
CREATE POLICY "Users can update own medications" ON medications
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Users can delete medications for their patient record
CREATE POLICY "Users can delete own medications" ON medications
    FOR DELETE USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- ====================
-- DOSAGE_SCHEDULES TABLE
-- ====================
CREATE TABLE dosage_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMPTZ NOT NULL,
    dose_amount TEXT NOT NULL,
    is_taken BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(medication_id, scheduled_time)
);

-- RLS Policies for dosage_schedules
ALTER TABLE dosage_schedules ENABLE ROW LEVEL SECURITY;

-- Users can read dosage schedules for their medications
CREATE POLICY "Users can view own dosage schedules" ON dosage_schedules
    FOR SELECT USING (
        medication_id IN (
            SELECT m.id FROM medications m 
            JOIN patients p ON m.patient_id = p.id 
            WHERE p.user_id = auth.uid()
        )
    );

-- Users can insert dosage schedules for their medications
CREATE POLICY "Users can insert own dosage schedules" ON dosage_schedules
    FOR INSERT WITH CHECK (
        medication_id IN (
            SELECT m.id FROM medications m 
            JOIN patients p ON m.patient_id = p.id 
            WHERE p.user_id = auth.uid()
        )
    );

-- Users can update dosage schedules for their medications
CREATE POLICY "Users can update own dosage schedules" ON dosage_schedules
    FOR UPDATE USING (
        medication_id IN (
            SELECT m.id FROM medications m 
            JOIN patients p ON m.patient_id = p.id 
            WHERE p.user_id = auth.uid()
        )
    );

-- ====================
-- INTAKE_LOGS TABLE
-- ====================
CREATE TABLE intake_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMPTZ,
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    status intake_status NOT NULL DEFAULT 'taken',
    dose_amount TEXT,
    notes TEXT,
    side_effects TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for intake_logs
ALTER TABLE intake_logs ENABLE ROW LEVEL SECURITY;

-- Users can read intake logs for their medications
CREATE POLICY "Users can view own intake logs" ON intake_logs
    FOR SELECT USING (
        medication_id IN (
            SELECT m.id FROM medications m 
            JOIN patients p ON m.patient_id = p.id 
            WHERE p.user_id = auth.uid()
        )
    );

-- Users can insert intake logs for their medications
CREATE POLICY "Users can insert own intake logs" ON intake_logs
    FOR INSERT WITH CHECK (
        medication_id IN (
            SELECT m.id FROM medications m 
            JOIN patients p ON m.patient_id = p.id 
            WHERE p.user_id = auth.uid()
        )
    );

-- Users can update intake logs for their medications
CREATE POLICY "Users can update own intake logs" ON intake_logs
    FOR UPDATE USING (
        medication_id IN (
            SELECT m.id FROM medications m 
            JOIN patients p ON m.patient_id = p.id 
            WHERE p.user_id = auth.uid()
        )
    );

-- ====================
-- APPOINTMENTS TABLE
-- ====================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    location TEXT,
    provider_name TEXT,
    provider_phone TEXT,
    appointment_type TEXT,
    status appointment_status DEFAULT 'scheduled',
    reminder_set BOOLEAN DEFAULT true,
    reminder_minutes_before INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Users can read appointments for their patient record
CREATE POLICY "Users can view own appointments" ON appointments
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Users can insert appointments for their patient record
CREATE POLICY "Users can insert own appointments" ON appointments
    FOR INSERT WITH CHECK (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Users can update appointments for their patient record
CREATE POLICY "Users can update own appointments" ON appointments
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Users can delete appointments for their patient record
CREATE POLICY "Users can delete own appointments" ON appointments
    FOR DELETE USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- ====================
-- NOTIFICATIONS TABLE
-- ====================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read notifications for their patient record
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Users can update notifications for their patient record
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- ====================
-- BADGES TABLE
-- ====================
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    criteria TEXT NOT NULL,
    points_required INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for badges (read-only for all authenticated users)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view badges" ON badges
    FOR SELECT USING (auth.role() = 'authenticated');

-- ====================
-- USER_BADGES TABLE
-- ====================
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    points_at_earning INTEGER DEFAULT 0,
    
    UNIQUE(user_id, badge_id)
);

-- RLS Policies for user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users can read their own badges
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

-- ====================
-- USER_STATS TABLE
-- ====================
CREATE TABLE user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_medications INTEGER DEFAULT 0,
    active_medications INTEGER DEFAULT 0,
    total_intakes INTEGER DEFAULT 0,
    successful_intakes INTEGER DEFAULT 0,
    missed_intakes INTEGER DEFAULT 0,
    adherence_rate DECIMAL(5,2) DEFAULT 0.00,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- RLS Policies for user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Users can read their own stats
CREATE POLICY "Users can view own stats" ON user_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own stats
CREATE POLICY "Users can update own stats" ON user_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- ====================
-- AUDIT_LOGS TABLE
-- ====================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for audit_logs (admin only, but allow users to view their own)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

-- ====================
-- CREATE INDEXES FOR PERFORMANCE
-- ====================

-- Patients indexes
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_created_at ON patients(created_at);

-- Medications indexes
CREATE INDEX idx_medications_patient_id ON medications(patient_id);
CREATE INDEX idx_medications_is_active ON medications(is_active);
CREATE INDEX idx_medications_generic_name ON medications(generic_name);

-- Dosage schedules indexes
CREATE INDEX idx_dosage_schedules_medication_id ON dosage_schedules(medication_id);
CREATE INDEX idx_dosage_schedules_scheduled_time ON dosage_schedules(scheduled_time);
CREATE INDEX idx_dosage_schedules_is_taken ON dosage_schedules(is_taken);

-- Intake logs indexes
CREATE INDEX idx_intake_logs_medication_id ON intake_logs(medication_id);
CREATE INDEX idx_intake_logs_taken_at ON intake_logs(taken_at);
CREATE INDEX idx_intake_logs_status ON intake_logs(status);

-- Appointments indexes
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_appointment_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Notifications indexes
CREATE INDEX idx_notifications_patient_id ON notifications(patient_id);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- User stats indexes
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_user_stats_adherence_rate ON user_stats(adherence_rate);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ====================
-- CREATE TRIGGERS FOR UPDATED_AT
-- ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dosage_schedules_updated_at BEFORE UPDATE ON dosage_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intake_logs_updated_at BEFORE UPDATE ON intake_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================
-- CREATE AUDIT TRIGGER FUNCTION
-- ====================
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, table_name, record_id, action, old_values, new_values)
        VALUES (auth.uid(), TG_TABLE_NAME, OLD.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, table_name, record_id, action, old_values)
        VALUES (auth.uid(), TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, table_name, record_id, action, new_values)
        VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to core tables
CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_medications AFTER INSERT OR UPDATE OR DELETE ON medications
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_dosage_schedules AFTER INSERT OR UPDATE OR DELETE ON dosage_schedules
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_intake_logs AFTER INSERT OR UPDATE OR DELETE ON intake_logs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointments AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ====================
-- INSERT DEFAULT BADGES
-- ====================
INSERT INTO badges (name, description, icon, criteria, points_required) VALUES
('first_medication', 'Registró su primera medicación', '🎯', 'Registrar primera medicación', 10),
('week_warrior', 'Tomó medicaciones durante 7 días consecutivos', '🔥', '7 días de adherencia consecutiva', 50),
('month_master', 'Tomó medicaciones durante 30 días consecutivos', '⭐', '30 días de adherencia consecutiva', 200),
('perfect_week', 'Adherencia perfecta durante una semana', '💯', '100% de adherencia en 7 días', 100),
('refill_champion', 'Registró 5 recargas de medicación', '💊', 'Registrar 5 recargas', 75),
('appointment_keeper', 'Asistió a 5 citas médicas', '📅', 'Completar 5 citas', 100),
('data_entry_pro', 'Registró 10 medicaciones diferentes', '📋', 'Registrar 10 medicaciones', 150),
('streak_keeper', 'Mantuvo una racha de 14 días', '🚀', '14 días de adherencia consecutiva', 100),
('health_champion', 'Adherencia superior al 90% este mes', '🏆', '90% de adherencia mensual', 300),
('notification_responder', 'Respondió a 50 notificaciones', '🔔', 'Responder a 50 notificaciones', 125);

-- ====================
-- GRANT PERMISSIONS
-- ====================
GRANT SELECT ON patients TO anon, authenticated;
GRANT INSERT, UPDATE ON patients TO authenticated;

GRANT SELECT ON medications TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON medications TO authenticated;

GRANT SELECT ON dosage_schedules TO anon, authenticated;
GRANT INSERT, UPDATE ON dosage_schedules TO authenticated;

GRANT SELECT ON intake_logs TO anon, authenticated;
GRANT INSERT, UPDATE ON intake_logs TO authenticated;

GRANT SELECT ON appointments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON appointments TO authenticated;

GRANT SELECT ON notifications TO anon, authenticated;
GRANT UPDATE ON notifications TO authenticated;

GRANT SELECT ON badges TO anon, authenticated;

GRANT SELECT ON user_badges TO anon, authenticated;

GRANT SELECT ON user_stats TO anon, authenticated;
GRANT INSERT, UPDATE ON user_stats TO authenticated;

GRANT SELECT ON audit_logs TO authenticated;