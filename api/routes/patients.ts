import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "..", ".env") });

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

router.post("/ensure", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No autorizado" });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Token inválido" });

    const userId = user.id;

    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      return res.json({ success: true, patientId: (existing as any).id });
    }

    const firstName =
      (user.user_metadata as any)?.full_name ||
      (user.email?.split("@")[0] ?? "Usuario");

    const { data: inserted, error: insertError } = await supabase
      .from("patients")
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: "",
        date_of_birth: "1990-01-01",
        preferred_language: "es",
        timezone: "Europe/Madrid",
        profile_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    await supabase.from("user_stats").upsert(
      {
        user_id: userId,
        total_medications: 0,
        active_medications: 0,
        total_intakes: 0,
        successful_intakes: 0,
        missed_intakes: 0,
        adherence_rate: 0.0,
        current_streak: 0,
        longest_streak: 0,
        total_points: 0,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" } as any
    );

    try {
      const { data: welcomeBadge } = await supabase
        .from("badges")
        .select("id")
        .eq("name", "welcome")
        .single();
      if ((welcomeBadge as any)?.id) {
        await supabase.from("user_badges").insert({
          user_id: userId,
          badge_id: (welcomeBadge as any).id,
          earned_at: new Date().toISOString(),
          points_at_earning: 0,
        } as any);
      }
    } catch {}

    return res.json({ success: true, patientId: (inserted as any).id });
  } catch (error) {
    console.error("Error ensuring patient profile:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No autorizado" });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Token inválido" });

    const { data, error } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) return res.status(404).json({ error: "No encontrado" });
    return res.json({ success: true, patientId: (data as any).id });
  } catch (err) {
    console.error("Error fetching patient id:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No autorizado" });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Token inválido" });

    const { data, error } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (!error && data) return res.json({ success: true, stats: data });

    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from("user_stats")
      .upsert(
        {
          user_id: user.id,
          total_medications: 0,
          active_medications: 0,
          total_intakes: 0,
          successful_intakes: 0,
          missed_intakes: 0,
          adherence_rate: 0.0,
          current_streak: 0,
          longest_streak: 0,
          total_points: 0,
          last_activity_at: now,
          updated_at: now,
        } as any,
        { onConflict: "user_id" } as any
      )
      .select("*")
      .single();

    if (insertError)
      return res.status(500).json({ error: insertError.message });
    return res.json({ success: true, stats: inserted });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/schedules/today", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No autorizado" });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Token inválido" });

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (!patient)
      return res.status(404).json({ error: "Paciente no encontrado" });
    const patientId = (patient as any).id;

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("dosage_schedules")
      .select(`*, medications!inner(*)`)
      .eq("medications.patient_id", patientId)
      .gte("scheduled_time", start.toISOString())
      .lt("scheduled_time", end.toISOString())
      .order("scheduled_time");

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching today's schedules:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/schedules/mark-taken", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { scheduleId } = req.body || {};
    if (!token) return res.status(401).json({ error: "No autorizado" });
    if (!scheduleId)
      return res.status(400).json({ error: "scheduleId requerido" });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Token inválido" });

    const { data: schedule, error: schedErr } = await supabase
      .from("dosage_schedules")
      .select("*")
      .eq("id", scheduleId)
      .single();
    if (schedErr || !schedule)
      return res.status(404).json({ error: "Horario no encontrado" });

    const { error: updErr } = await supabase
      .from("dosage_schedules")
      .update({ is_taken: true })
      .eq("id", scheduleId);
    if (updErr) return res.status(500).json({ error: updErr.message });

    const medicationId = (schedule as any).medication_id;
    const scheduledIso = (schedule as any).scheduled_time as string;

    const { data: existing } = await supabase
      .from("intake_logs")
      .select("id")
      .eq("medication_id", medicationId)
      .eq("scheduled_time", scheduledIso)
      .eq("status", "taken")
      .limit(1);

    if (!Array.isArray(existing) || existing.length === 0) {
      await supabase.from("intake_logs").insert({
        medication_id: medicationId,
        scheduled_time: scheduledIso,
        taken_at: new Date().toISOString(),
        status: "taken",
        notes: "Tomado vía API",
      } as any);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Error marking schedule taken:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/medications/finalize", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { medicationId } = req.body || {};
    if (!token) return res.status(401).json({ error: "No autorizado" });
    if (!medicationId)
      return res.status(400).json({ error: "medicationId requerido" });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Token inválido" });

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (!patient)
      return res.status(404).json({ error: "Paciente no encontrado" });
    const patientId = (patient as any).id;

    const { data: med, error: medErr } = await supabase
      .from("medications")
      .select("*")
      .eq("id", medicationId)
      .eq("patient_id", patientId)
      .single();
    if (medErr || !med)
      return res.status(404).json({ error: "Medicamento no encontrado" });

    const today = new Date().toISOString().split("T")[0];
    const { error: updErr } = await supabase
      .from("medications")
      .update({
        is_active: false,
        end_date: (med as any).end_date || today,
      } as any)
      .eq("id", medicationId);
    if (updErr) return res.status(500).json({ error: updErr.message });

    // Remove all future schedules (including remaining today) that are not taken
    const cutoff = new Date(((med as any).end_date || today) + "T00:00:00");
    const startIso = cutoff.toISOString();

    const { error: delErr } = await supabase
      .from("dosage_schedules")
      .delete()
      .eq("medication_id", medicationId)
      .gte("scheduled_time", startIso)
      .or("is_taken.is.null,is_taken.eq.false");
    if (delErr) return res.status(500).json({ error: delErr.message });

    return res.json({ success: true });
  } catch (err) {
    console.error("Error finalizing medication:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/medications/delete", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { medicationId } = req.body || {};
    if (!token) return res.status(401).json({ error: "No autorizado" });
    if (!medicationId)
      return res.status(400).json({ error: "medicationId requerido" });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Token inválido" });

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (!patient)
      return res.status(404).json({ error: "Paciente no encontrado" });
    const patientId = (patient as any).id;

    const { data: med, error: medErr } = await supabase
      .from("medications")
      .select("id, patient_id")
      .eq("id", medicationId)
      .eq("patient_id", patientId)
      .single();
    if (medErr || !med)
      return res.status(404).json({ error: "Medicamento no encontrado" });

    // Delete related schedules and intake logs
    await supabase
      .from("dosage_schedules")
      .delete()
      .eq("medication_id", medicationId);
    await supabase
      .from("intake_logs")
      .delete()
      .eq("medication_id", medicationId);

    // Delete medication row
    const { error: delMedErr } = await supabase
      .from("medications")
      .delete()
      .eq("id", medicationId);
    if (delMedErr) return res.status(500).json({ error: delMedErr.message });

    return res.json({ success: true });
  } catch (err) {
    console.error("Error deleting medication:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
