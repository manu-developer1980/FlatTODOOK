import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pill,
  Clock,
  CheckCircle,
  Circle,
} from "lucide-react";
import { useAuthStore } from "../stores/auth";
import { db } from "../lib/supabase";
// import { NotificationService } from '../services/notificationService';
import {
  Medication,
  DosageSchedule,
  IntakeLog,
  MEDICATION_FORMS,
} from "../types";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { hasUserId } from "@/lib/userUtils";

interface DaySchedule {
  date: Date;
  medications: {
    medication: Medication;
    schedule: DosageSchedule;
    taken: boolean;
    log?: IntakeLog;
  }[];
}

export default function Calendar() {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [medications, setMedications] = useState<Medication[]>([]);
  const [dosageSchedules, setDosageSchedules] = useState<DosageSchedule[]>([]);
  const [intakeLogs, setIntakeLogs] = useState<IntakeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [newTreatment, setNewTreatment] = useState({
    medicationId: "",
    dosage: "",
    frequency: "daily",
    specific_times: ["09:00:00"],
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  });

  const getDoseUnit = (form: Medication["form"] | undefined) => {
    switch (form) {
      case "tablet":
        return "comprimidos";
      case "capsule":
        return "cápsulas";
      case "liquid":
        return "ml";
      case "inhaler":
        return "pufs";
      case "drops":
        return "gotas";
      case "injection":
        return "ml";
      case "patch":
        return "parches";
      default:
        return "unidad";
    }
  };

  const dosePlaceholder = (() => {
    const med = medications.find((m) => m.id === newTreatment.medicationId);
    const unit = getDoseUnit(med?.form);
    return `Ej: 1 ${unit}`;
  })();

  useEffect(() => {
    loadData();
  }, [user, currentDate]);

  useEffect(() => {
    generateWeekSchedule();
  }, [medications, dosageSchedules, intakeLogs, currentDate]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Safety net: deactivate expired medications
      try {
        await (db as any).deactivateExpiredMedications(user.id);
      } catch {}

      // Get patient profile first
      const { data: patientData, error: patientError } = await db.getUser(
        user.id
      );
      if (patientError || !patientData) {
        setLoading(false);
        return;
      }

      // Get active medications for this patient
      const { data: medsData, error: medsError } = await db.getMedications(
        user.id,
        false
      );
      if (medsError) throw medsError;
      setMedications(medsData || []);

      // Get dosage schedules for the entire week
      const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
      // Ensure schedules exist for this range (idempotent)
      await (db as any).ensureSchedulesForDateRange(
        user.id,
        startDate,
        endDate
      );
      const { data: schedulesData, error: schedulesError } = await (
        db as any
      ).getSchedulesForDateRange(user.id, startDate, endDate);
      if (schedulesError) throw schedulesError;
      setDosageSchedules(schedulesData || []);

      // Get intake logs for the current period
      const { data: logsData, error: logsError } = await db.getIntakeLogs(
        user.id
      );
      if (logsError) throw logsError;

      // Filter logs for current week
      const weekLogs = ((logsData as any[]) || []).filter((log: any) => {
        if (!log.taken_at) return false;
        const logDate = parseISO(log.taken_at);
        return logDate >= startDate && logDate <= endDate;
      });
      setIntakeLogs(weekLogs);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar datos del calendario");
    } finally {
      setLoading(false);
    }
  };

  const generateWeekSchedule = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });

    console.log("Generating week schedule:", { start, end, currentDate });
    console.log("Medications:", medications);
    console.log("Dosage schedules:", dosageSchedules);

    const schedule: DaySchedule[] = [];
    let current = start;

    while (current <= end) {
      const dayMeds: DaySchedule["medications"] = [];

      medications.forEach((medication) => {
        // Get schedules for this medication
        const medSchedules = dosageSchedules.filter(
          (schedule) => schedule.medication_id === medication.id
        );

        medSchedules.forEach((scheduleItem) => {
          const scheduleDate = new Date(scheduleItem.scheduled_time);
          console.log(
            `Checking schedule ${scheduleItem.id}: medication=${
              medication.generic_name
            }, scheduled_time=${
              scheduleItem.scheduled_time
            }, current=${current}, isSameDay=${isSameDay(
              scheduleDate,
              current
            )}`
          );
          if (isSameDay(scheduleDate, current)) {
            const isTaken = scheduleItem.is_taken;

            const log = intakeLogs.find(
              (log) =>
                log.medication_id === medication.id &&
                isSameDay(parseISO(log.taken_at), current)
            );

            dayMeds.push({
              medication,
              schedule: scheduleItem,
              taken: isTaken,
              log,
            });
          }
        });
      });

      schedule.push({
        date: new Date(current),
        medications: dayMeds.sort((a, b) => {
          const timeA = new Date(a.schedule.scheduled_time).getTime();
          const timeB = new Date(b.schedule.scheduled_time).getTime();
          return timeA - timeB;
        }),
      });

      current = addDays(current, 1);
    }

    console.log("Generated week schedule:", schedule);
    setWeekSchedule(schedule);
  };

  const handleMarkAsTaken = async (
    scheduleId: string,
    medicationId: string
  ) => {
    if (!user) return;
    if (processing[scheduleId]) return;

    try {
      setProcessing((prev) => ({ ...prev, [scheduleId]: true }));
      const medication = medications.find((med) => med.id === medicationId);
      if (!medication) {
        console.error("Medication not found in array:", medicationId);
        toast.error("Medicamento no encontrado");
        return;
      }

      const currentSchedule = dosageSchedules.find(
        (schedule) => schedule.id === scheduleId
      );
      const scheduledDate =
        currentSchedule?.scheduled_time || new Date().toISOString();

      const scheduled = new Date(scheduledDate);
      if (scheduled.getTime() > Date.now()) {
        toast.error("No puedes marcar tomas futuras");
        return;
      }

      const { data: existingLogs, error: existingError } = await (
        db as any
      ).getIntakeLogForMedicationAtTime(medicationId, scheduledDate);
      if (
        !existingError &&
        Array.isArray(existingLogs) &&
        existingLogs.length > 0
      ) {
        if (!currentSchedule?.is_taken) {
          const { error: updErr } = await db.updateScheduleStatus(
            scheduleId,
            "taken"
          );
          if (!updErr) {
            setDosageSchedules((prev) =>
              prev.map((s) =>
                s.id === scheduleId ? { ...s, is_taken: true } : s
              )
            );
          }
        }
        toast.info("Este horario ya estaba registrado como tomado");
        await loadData();
        return;
      }

      const { error: updateError } = await (db as any).updateScheduleStatus(
        scheduleId,
        "taken"
      );
      if (updateError) {
        console.error("Error updating schedule status:", updateError);
        toast.error("Error al actualizar el estado");
        return;
      }
      setDosageSchedules((prev) =>
        prev.map((s) => (s.id === scheduleId ? { ...s, is_taken: true } : s))
      );

      // Crear el intake log para estadísticas
      console.log("Creating intake log for medication:", medicationId);
      console.log("Scheduled date:", scheduledDate);

      const { data: logData, error: logError } = await db.createIntakeLog(
        medicationId,
        {
          taken_at: new Date().toISOString(),
          scheduled_time: scheduledDate,
          status: "taken",
          notes: "Tomado desde calendario",
        }
      );

      console.log("Intake log creation result:", { logData, logError });

      if (logError) {
        console.error("Error creating intake log:", logError);
        toast.warning(
          "Medicamento marcado como tomado, pero hubo un error al registrar la estadística"
        );
      } else {
        console.log("Intake log created successfully:", logData);
        toast.success("Medicamento marcado como tomado");
      }

      await loadData();
    } catch (error) {
      console.error("Error marking as taken:", error);
      toast.error("Error al marcar como tomado");
    } finally {
      setProcessing((prev) => {
        const { [scheduleId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subDays(prev, 7) : addDays(prev, 7)
    );
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Calendario de Medicamentos
          </h1>
          <p className="text-xl text-gray-600">
            Visualiza y gestiona tu horario semanal de medicamentos
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateWeek("prev")}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-h-[44px]"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={navigateToToday}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-lg transition-colors min-h-[44px]"
              >
                Hoy
              </button>
              <button
                onClick={() => navigateWeek("next")}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-h-[44px]"
                aria-label="Semana siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                {format(
                  startOfWeek(currentDate, { weekStartsOn: 1 }),
                  "MMMM yyyy",
                  { locale: es }
                )}
              </h2>
              <p className="text-lg text-gray-600">
                Semana del{" "}
                {format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d")} al{" "}
                {format(endOfWeek(currentDate, { weekStartsOn: 1 }), "d")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAddOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-lg transition-colors min-h-[44px]"
              >
                Añadir tratamiento
              </button>
            </div>
          </div>
        </div>

        {/* Week View - Redesigned as List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {weekSchedule.map((day, index) => {
              const isToday = isSameDay(day.date, new Date());
              const isSelected =
                selectedDate && isSameDay(day.date, selectedDate);
              const hasMedications = day.medications.length > 0;
              const allTaken =
                day.medications.length > 0 &&
                day.medications.every((med) => med.taken);
              const takenCount = day.medications.filter(
                (med) => med.taken
              ).length;

              return (
                <div
                  key={index}
                  className={`p-6 ${
                    isToday
                      ? "bg-green-50"
                      : isSelected
                      ? "bg-blue-50"
                      : "bg-white"
                  }`}
                >
                  {/* Day Header */}
                  <div
                    className={`flex items-center justify-between mb-4 cursor-pointer transition-colors ${
                      isToday
                        ? "bg-green-100"
                        : isSelected
                        ? "bg-blue-100"
                        : "hover:bg-gray-50"
                    } p-4 rounded-lg`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-medium text-gray-500 mb-1">
                          {format(day.date, "EEE", { locale: es })}
                        </div>
                        <div
                          className={`text-3xl font-bold ${
                            isToday ? "text-green-600" : "text-gray-900"
                          }`}
                        >
                          {format(day.date, "d")}
                        </div>
                      </div>

                      {hasMedications && (
                        <div className="flex items-center gap-2">
                          {allTaken ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-600">
                            {takenCount}/{day.medications.length} tomados
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {hasMedications
                          ? Math.round(
                              (takenCount / day.medications.length) * 100
                            )
                          : 0}
                        %
                      </div>
                      <div className="text-sm text-gray-500">adherencia</div>
                    </div>
                  </div>

                  {/* Day Medications */}
                  <div className="">
                    {day.medications.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          Sin medicamentos programados para este día
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {day.medications.map((med, medIndex) => (
                          <div
                            key={medIndex}
                            className={`p-4 rounded-lg border transition-all ${
                              med.taken
                                ? "bg-green-50 border-green-200"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-gray-600" />
                                <span className="font-semibold text-gray-900 text-lg">
                                  {format(
                                    new Date(med.schedule.scheduled_time),
                                    "HH:mm"
                                  )}
                                </span>
                              </div>
                              {med.taken ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                  <span className="text-sm font-medium text-green-600">
                                    Tomado
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleMarkAsTaken(
                                      med.schedule.id,
                                      med.medication.id
                                    )
                                  }
                                  disabled={
                                    new Date(
                                      med.schedule.scheduled_time
                                    ).getTime() > Date.now() ||
                                    !!processing[med.schedule.id]
                                  }
                                  title={
                                    new Date(
                                      med.schedule.scheduled_time
                                    ).getTime() > Date.now()
                                      ? "No puedes marcar tomas futuras"
                                      : undefined
                                  }
                                  className={`${
                                    new Date(
                                      med.schedule.scheduled_time
                                    ).getTime() > Date.now()
                                      ? "bg-red-600 hover:bg-red-700"
                                      : "bg-green-600 hover:bg-green-700"
                                  } text-white px-4 py-2 rounded-lg font-medium transition-colors min-h-[40px]`}
                                >
                                  {new Date(
                                    med.schedule.scheduled_time
                                  ).getTime() > Date.now()
                                    ? "Pendiente"
                                    : "Tomar"}
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  try {
                                    const { error } = await (
                                      db as any
                                    ).finalizeMedication(med.medication.id);
                                    if (error) throw error;
                                    toast.success("Tratamiento finalizado");
                                    loadData();
                                  } catch {
                                    toast.error("No se pudo finalizar");
                                  }
                                }}
                                className="ml-3 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm min-h-[36px]"
                              >
                                Finalizar
                              </button>
                            </div>

                            <div className="flex items-start gap-3">
                              <Pill className="w-5 h-5 text-green-600 mt-1" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-base mb-1">
                                  {med.medication.generic_name}
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                  {med.schedule.dose_amount}
                                </div>
                                {med.medication.end_date && (
                                  <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                    Hasta:{" "}
                                    {format(
                                      new Date(med.medication.end_date),
                                      "dd/MM/yyyy"
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail */}
        {selectedDate && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Detalles del{" "}
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </h3>

            {(() => {
              const dayMeds =
                weekSchedule.find((day) => isSameDay(day.date, selectedDate))
                  ?.medications || [];
              const takenCount = dayMeds.filter((med) => med.taken).length;
              const totalCount = dayMeds.length;

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        Progreso del día
                      </div>
                      <div className="text-sm text-gray-600">
                        {takenCount} de {totalCount} medicamentos tomados
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {totalCount > 0
                        ? Math.round((takenCount / totalCount) * 100)
                        : 0}
                      %
                    </div>
                  </div>

                  {dayMeds.length > 0 && (
                    <div className="grid gap-3">
                      {dayMeds.map((med, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            med.taken
                              ? "bg-green-50 border-green-200"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                med.taken ? "bg-green-600" : "bg-gray-300"
                              }`}
                            >
                              {med.taken ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : (
                                <Circle className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {med.medication.generic_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {format(
                                  new Date(med.schedule.scheduled_time),
                                  "HH:mm"
                                )}{" "}
                                - {med.schedule.dose_amount}
                              </div>
                              {med.medication.end_date && (
                                <div className="text-xs text-gray-500">
                                  Hasta:{" "}
                                  {format(
                                    new Date(med.medication.end_date),
                                    "dd/MM/yyyy"
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {!med.taken && (
                            <button
                              onClick={() =>
                                handleMarkAsTaken(
                                  med.schedule.id,
                                  med.medication.id
                                )
                              }
                              disabled={
                                new Date(
                                  med.schedule.scheduled_time
                                ).getTime() > Date.now() ||
                                !!processing[med.schedule.id]
                              }
                              title={
                                new Date(
                                  med.schedule.scheduled_time
                                ).getTime() > Date.now()
                                  ? "No puedes marcar tomas futuras"
                                  : undefined
                              }
                              className={`${
                                new Date(
                                  med.schedule.scheduled_time
                                ).getTime() > Date.now()
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-green-600 hover:bg-green-700"
                              } text-white px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px]`}
                            >
                              {new Date(med.schedule.scheduled_time).getTime() >
                              Date.now()
                                ? "Pendiente"
                                : "Marcar como tomado"}
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                await (db as any).updateMedication(
                                  med.medication.id,
                                  {
                                    is_active: false,
                                    end_date: new Date()
                                      .toISOString()
                                      .split("T")[0],
                                  }
                                );
                                toast.success("Tratamiento finalizado");
                                loadData();
                              } catch {
                                toast.error("No se pudo finalizar");
                              }
                            }}
                            className="ml-3 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm min-h-[36px]"
                          >
                            Finalizar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {addOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Añadir tratamiento
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicamento
                </label>
                <select
                  value={newTreatment.medicationId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const med = medications.find((m) => m.id === id);
                    const unit = getDoseUnit(med?.form);
                    setNewTreatment({
                      ...newTreatment,
                      medicationId: id,
                      dosage: newTreatment.dosage?.trim()
                        ? newTreatment.dosage
                        : `1 ${unit}`,
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecciona…</option>
                  {medications.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                    >
                      {m.generic_name} {m.strength} (
                      {MEDICATION_FORMS[m.form] || m.form})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosis
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={(() => {
                      const amt = newTreatment.dosage.match(/^[\d.]+/);
                      return amt ? amt[0] : "";
                    })()}
                    onChange={(e) => {
                      const med = medications.find(
                        (m) => m.id === newTreatment.medicationId
                      );
                      const unit = getDoseUnit(med?.form);
                      const val = e.target.value;
                      setNewTreatment({
                        ...newTreatment,
                        dosage: val ? `${val} ${unit}` : "",
                      });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    placeholder={dosePlaceholder
                      .replace(/Ej:\s*/i, "Ej: ")
                      .replace(/\s+\w+$/, "")}
                  />
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {(() => {
                      const med = medications.find(
                        (m) => m.id === newTreatment.medicationId
                      );
                      return getDoseUnit(med?.form);
                    })()}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia
                </label>
                <select
                  value={newTreatment.frequency}
                  onChange={(e) =>
                    setNewTreatment({
                      ...newTreatment,
                      frequency: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="daily">Una vez al día</option>
                  <option value="twice_daily">Dos veces al día</option>
                  <option value="three_times_daily">Tres veces al día</option>
                  <option value="four_times_daily">Cuatro veces al día</option>
                  <option value="every_8_hours">Cada 8 horas</option>
                  <option value="every_12_hours">Cada 12 horas</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensualmente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horarios
                </label>
                <input
                  value={newTreatment.specific_times.join(",")}
                  onChange={(e) =>
                    setNewTreatment({
                      ...newTreatment,
                      specific_times: e.target.value
                        .split(",")
                        .map((s) => s.trim()),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="08:00:00, 20:00:00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato HH:mm:ss, separados por comas
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inicio
                  </label>
                  <input
                    type="date"
                    value={newTreatment.start_date}
                    onChange={(e) =>
                      setNewTreatment({
                        ...newTreatment,
                        start_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin
                  </label>
                  <input
                    type="date"
                    value={newTreatment.end_date}
                    onChange={(e) =>
                      setNewTreatment({
                        ...newTreatment,
                        end_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!user || !newTreatment.medicationId) return;
                  const payload: any = {
                    dosage: newTreatment.dosage,
                    frequency: newTreatment.frequency,
                    specific_times: newTreatment.specific_times,
                    start_date: newTreatment.start_date,
                    end_date: newTreatment.end_date || undefined,
                    is_active: true,
                  };
                  try {
                    await (db as any).createMedicationTreatment(
                      user.id,
                      payload,
                      newTreatment.medicationId
                    );
                    toast.success("Tratamiento creado");
                    setAddOpen(false);
                    loadData();
                  } catch (e) {
                    toast.error("Error al crear tratamiento");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
