import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pill,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuthStore } from "../stores/auth";
import { db } from "../lib/supabase";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { toast } from "sonner";
import { hasUserId } from "@/lib/userUtils";

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        // Cargar horario de hoy
        const { data: scheduleData } = await db.getTodaySchedule(user.id);
        if (scheduleData) {
          setTodaySchedule(scheduleData);
        }

        // Cargar estadísticas básicas
        const { data: statsData } = await db.getAdherenceStats(user.id);
        if (statsData) {
          setStatistics(statsData);
        }
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const handleMarkAsTaken = async (
    scheduleId: string,
    medicationId: string
  ) => {
    if (!user) return;

    try {
      // Get the current schedule to find the scheduled date
      const { data: scheduleData } = await db.getTodaySchedule(user.id);
      const currentSchedule = scheduleData?.find(
        (item: any) => item.id === scheduleId
      );
      const scheduledDate =
        currentSchedule?.scheduled_time || new Date().toISOString();

      // Update the schedule status
      const { error: updateError } = await db.updateScheduleStatus(
        scheduleId,
        "taken"
      );
      if (updateError) {
        console.error("Error updating schedule status:", updateError);
        toast.error("Error al actualizar el estado");
        return;
      }

      // Create intake log for statistics
      console.log("Creating intake log for medication:", medicationId);
      console.log("Scheduled date:", scheduledDate);
      console.log("Current user:", user.id);

      const intakeLogData = {
        taken_at: new Date().toISOString(),
        scheduled_time: scheduledDate,
        status: "taken",
        notes: "Tomado desde dashboard",
      };

      console.log("Intake log data:", intakeLogData);

      const { data: logData, error: logError } = await db.createIntakeLog(
        medicationId,
        intakeLogData
      );

      console.log("Intake log creation result:", { logData, logError });

      if (logError) {
        console.error("Detailed error:", JSON.stringify(logError, null, 2));
      }

      if (logError) {
        console.error("Error creating intake log:", logError);
        // Don't fail the operation if log creation fails, but show warning
        toast.warning(
          "Medicamento marcado como tomado, pero hubo un error al registrar la estadística"
        );
      } else {
        console.log("Intake log created successfully:", logData);
        toast.success("Medicamento marcado como tomado");
      }

      // Reload data
      const { data: newScheduleData } = await db.getTodaySchedule(user.id);
      if (newScheduleData) {
        setTodaySchedule(newScheduleData);
      }
    } catch (error) {
      console.error("Error marking as taken:", error);
      toast.error("Error al marcar como tomado");
    }
  };

  const getMedicationStatus = (medication: any) => {
    if (medication.is_taken) return "taken";

    const scheduledTime = new Date(medication.scheduled_time);
    const now = new Date();

    // If scheduled time is in the past and not taken, it's omitted
    if (scheduledTime < now) return "omitted";

    return "pending";
  };

  const pendingMedications = todaySchedule.filter((med: any) => !med.is_taken);
  const takenMedications = todaySchedule.filter((med: any) => med.is_taken);
  const adherenceRate = statistics ? statistics.adherence_rate : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ¡Hola,{" "}
              {(user as any)?.first_name
                ? (user as any).first_name
                : (user as any)?.user_metadata?.full_name?.split(" ")[0] ||
                  "Usuario"}
              ! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {adherenceRate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Adherencia esta semana</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3">
              <Pill className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hoy</p>
              <p className="text-2xl font-bold text-gray-900">
                {todaySchedule.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tomadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {takenMedications.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 rounded-full p-3">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingMedications.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Racha</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.streak_days || 0} días
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Medications */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Medicaciones de Hoy
          </h2>
          <span className="text-sm text-gray-500">
            {takenMedications.length} de {todaySchedule.length} completadas
          </span>
        </div>

        {todaySchedule.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No hay medicaciones programadas para hoy
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaySchedule.map((medication: any) => (
              <div
                key={medication.id}
                className={`p-4 rounded-lg border-2 ${
                  medication.is_taken
                    ? "bg-green-50 border-green-200"
                    : !medication.is_taken
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`rounded-full p-2 ${
                        medication.is_taken
                          ? "bg-green-100"
                          : !medication.is_taken
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}>
                      {medication.is_taken ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Clock className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {medication.medications?.generic_name ||
                          medication.medications?.name ||
                          "Medicamento"}
                      </h3>
                      <p className="text-gray-600">
                        {medication.dose_amount} -{" "}
                        {new Date(medication.scheduled_time).toLocaleTimeString(
                          "es-ES",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const status = getMedicationStatus(medication);
                      if (status === "taken") {
                        return (
                          <span className="text-green-600 font-semibold">
                            Tomada
                          </span>
                        );
                      } else if (status === "pending") {
                        return (
                          <button
                            onClick={() =>
                              handleMarkAsTaken(
                                medication.id,
                                medication.medication_id
                              )
                            }
                            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
                            Tomar
                          </button>
                        );
                      } else {
                        return <span className="text-gray-600">Omitida</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Pill className="w-8 h-8 text-primary mr-3" />
            <h3 className="text-xl font-bold text-gray-900">
              Añadir Medicación
            </h3>
          </div>
          <p className="text-gray-600 mb-4">
            Registra una nueva medicación en tu tratamiento
          </p>
          <button
            className="btn-primary w-full"
            onClick={() => navigate("/medications/add")}>
            Nueva Medicación
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="w-8 h-8 text-secondary mr-3" />
            <h3 className="text-xl font-bold text-gray-900">
              Invitar Cuidador
            </h3>
          </div>
          <p className="text-gray-600 mb-4">
            Añade a un familiar o amigo para que te ayude
          </p>
          <button
            className="btn-secondary w-full"
            onClick={() =>
              navigate("/settings?tab=caregivers", {
                state: { activeTab: "caregivers" },
              })
            }>
            Invitar Cuidador
          </button>
        </div>
      </div>
    </div>
  );
}
