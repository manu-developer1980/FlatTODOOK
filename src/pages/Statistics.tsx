import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Pill,
  Clock,
  Award,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { useAuthStore } from "../stores/auth";
import { db } from "../lib/supabase";
import { Medication, IntakeLog } from "@/types/database";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { hasUserId } from "@/lib/userUtils";

interface StatisticsData {
  totalMedications: number;
  activeMedications: number;
  adherenceRate: number;
  currentStreak: number;
  longestStreak: number;
  weeklyAdherence: number;
  monthlyAdherence: number;
}

interface DailyAdherence {
  date: string;
  adherence: number;
  taken: number;
  total: number;
}

interface MedicationStats {
  name: string;
  adherence: number;
  taken: number;
  total: number;
  color: string;
}

const COLORS = [
  "#2E8B57",
  "#FF6B35",
  "#4A90E2",
  "#F5A623",
  "#7ED321",
  "#9013FE",
  "#50E3C2",
  "#BD10E0",
];

export default function Statistics() {
  const { user } = useAuthStore();
  const [medications, setMedications] = useState<any[]>([]);
  const [intakeLogs, setIntakeLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "3months">(
    "month"
  );
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalMedications: 0,
    activeMedications: 0,
    adherenceRate: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyAdherence: 0,
    monthlyAdherence: 0,
  });
  const [dailyAdherence, setDailyAdherence] = useState<DailyAdherence[]>([]);
  const [medicationStats, setMedicationStats] = useState<MedicationStats[]>([]);

  useEffect(() => {
    loadData();
  }, [user, timeRange]);

  // Also load data when component mounts (in case data changed from other pages)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadData();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user]);

  useEffect(() => {
    calculateStatistics();
  }, [medications, intakeLogs, timeRange]);

  const [schedules, setSchedules] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log("Loading data for user:", user.id);
      // Safety net: deactivate expired medications
      try {
        await (db as any).deactivateExpiredMedications(user.id);
      } catch {}
      const today = new Date();
      const startDate =
        timeRange === "week"
          ? subDays(today, 7)
          : timeRange === "month"
          ? subDays(today, 30)
          : subDays(today, 90);

      const [medsResponse, logsResponse, schedulesResponse] = await Promise.all(
        [
          db.getMedications(user.id),
          db.getIntakeLogs(user.id),
          (db as any).getSchedulesForDateRange(user.id, startDate, today),
        ]
      );

      console.log("Medications response:", medsResponse);
      console.log("Intake logs response:", logsResponse);
      console.log("Schedules response:", schedulesResponse);

      setMedications(medsResponse.data || []);
      setIntakeLogs(logsResponse.data || []);
      setSchedules((schedulesResponse as any).data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = () => {
    console.log("=== CALCULATING STATISTICS ===");
    console.log("All medications:", medications);
    console.log("All intake logs:", intakeLogs);

    const activeMeds = medications.filter((med) => med.is_active);
    const totalMeds = medications.length;

    console.log("Active medications:", activeMeds);

    // Calculate adherence rates
    const today = new Date();
    const startDate =
      timeRange === "week"
        ? subDays(today, 7)
        : timeRange === "month"
        ? subDays(today, 30)
        : subDays(today, 90);

    console.log("Date range:", startDate, "to", today);

    const relevantSchedules = schedules.filter((s) => {
      const d = parseISO(s.scheduled_time);
      return d >= startDate && d <= today;
    });

    console.log("Relevant schedules in date range:", relevantSchedules);

    // Calculate expected doses
    const expectedDoses = relevantSchedules.length;
    const takenDoses = relevantSchedules.filter((s: any) => s.is_taken).length;

    console.log("Taken doses:", takenDoses);

    const adherenceRate =
      expectedDoses > 0 ? (takenDoses / expectedDoses) * 100 : 0;
    console.log("Calculated adherence rate:", adherenceRate);

    // Calculate streaks
    const streaks = calculateStreaks();

    // Calculate weekly and monthly adherence
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const weeklySchedules = schedules.filter((s) => {
      const d = parseISO(s.scheduled_time);
      return d >= weekStart && d <= weekEnd;
    });
    const monthlySchedules = schedules.filter((s) => {
      const d = parseISO(s.scheduled_time);
      return d >= monthStart && d <= today;
    });

    const weeklyAdherence = calculatePeriodAdherence(weeklySchedules);
    const monthlyAdherence = calculatePeriodAdherence(monthlySchedules);

    setStatistics({
      totalMedications: totalMeds,
      activeMedications: activeMeds.length,
      adherenceRate: Math.round(adherenceRate),
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      weeklyAdherence: Math.round(weeklyAdherence),
      monthlyAdherence: Math.round(monthlyAdherence),
    });

    // Calculate daily adherence for chart
    calculateDailyAdherence(startDate, today);

    // Calculate medication-specific stats
    calculateMedicationStats(activeMeds);
  };

  const calculateStreaks = () => {
    const sortedLogs = intakeLogs
      .filter((log) => log.taken_at)
      .sort(
        (a, b) =>
          parseISO(b.taken_at!).getTime() - parseISO(a.taken_at!).getTime()
      );

    if (sortedLogs.length === 0) return { current: 0, longest: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedLogs.length; i++) {
      const currentDate = parseISO(sortedLogs[i - 1].taken_at!);
      const previousDate = parseISO(sortedLogs[i].taken_at!);
      const daysDiff = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak (last consecutive days)
    const today = new Date();
    const lastTakenDate = parseISO(sortedLogs[0].taken_at!);
    const daysSinceLastTaken = Math.floor(
      (today.getTime() - lastTakenDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastTaken <= 1) {
      currentStreak = 1;
      for (let i = 1; i < sortedLogs.length; i++) {
        const currentDate = parseISO(sortedLogs[i - 1].taken_at!);
        const previousDate = parseISO(sortedLogs[i].taken_at!);
        const daysDiff = Math.floor(
          (currentDate.getTime() - previousDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { current: currentStreak, longest: longestStreak };
  };

  const calculatePeriodAdherence = (schedulesList: any[]) => {
    const expected = schedulesList.length;
    const taken = schedulesList.filter((s) => s.is_taken).length;
    const value = expected > 0 ? (taken / expected) * 100 : 0;
    return Math.max(0, Math.min(100, value));
  };

  const calculateDailyAdherence = (startDate: Date, endDate: Date) => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const schedulesByDay = schedules.reduce(
      (acc: Record<string, any[]>, s: any) => {
        const key = format(parseISO(s.scheduled_time), "dd/MM");
        acc[key] = acc[key] || [];
        acc[key].push(s);
        return acc;
      },
      {}
    );

    const dailyData: DailyAdherence[] = days.map((day) => {
      const key = format(day, "dd/MM");
      const daySchedules = schedulesByDay[key] || [];
      const expectedDoses = daySchedules.length;
      const takenDoses = daySchedules.filter((s: any) => s.is_taken).length;

      return {
        date: key,
        adherence:
          expectedDoses > 0
            ? Math.min(100, Math.max(0, (takenDoses / expectedDoses) * 100))
            : 0,
        taken: takenDoses,
        total: expectedDoses,
      };
    });

    setDailyAdherence(dailyData);
  };

  const calculateMedicationStats = (activeMeds: Medication[]) => {
    console.log("Active medications:", activeMeds);
    console.log("Intake logs:", intakeLogs);

    if (!intakeLogs || intakeLogs.length === 0) {
      console.log("No intake logs found");
      return;
    }

    const stats: MedicationStats[] = activeMeds
      .map((medication, index) => {
        console.log(
          `Processing medication: ${medication.generic_name} (ID: ${medication.id})`
        );

        const medLogs = intakeLogs.filter((log) => {
          console.log(
            `Comparing log medication_id: ${log.medication_id} with medication id: ${medication.id}`
          );
          console.log(
            `Types - log.medication_id: ${typeof log.medication_id}, medication.id: ${typeof medication.id}`
          );
          console.log(`Are they equal? ${log.medication_id === medication.id}`);
          return log.medication_id === medication.id;
        });

        console.log(
          `Found ${medLogs.length} logs for medication ${medication.generic_name}`
        );
        console.log("Matching logs:", medLogs);

        const takenLogs = medLogs.filter((log) => log.taken_at);
        const expectedDoses = 30; // Default to once daily for 30 days as rough estimate

        console.log(
          `Medication ${medication.generic_name}: ${takenLogs.length}/${expectedDoses} taken`
        );

        return {
          name: medication.generic_name,
          adherence:
            expectedDoses > 0 ? (takenLogs.length / expectedDoses) * 100 : 0,
          taken: takenLogs.length,
          total: expectedDoses,
          color: COLORS[index % COLORS.length],
        };
      })
      .sort((a, b) => b.adherence - a.adherence);

    setMedicationStats(stats);
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div
      className="bg-white rounded-lg shadow-sm p-6 border-l-4"
      style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
    </div>
  );

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
            Estadísticas
          </h1>
          <p className="text-xl text-gray-600">
            Analiza tu adherencia y progreso en el tratamiento
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Período de Análisis
            </h2>
            <div className="flex gap-2">
              {[
                { value: "week", label: "Última Semana" },
                { value: "month", label: "Último Mes" },
                { value: "3months", label: "Últimos 3 Meses" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value as any)}
                  className={`px-6 py-3 rounded-lg font-semibold text-lg transition-colors min-h-[44px] ${
                    timeRange === option.value
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Adherencia General"
            value={`${statistics.adherenceRate}%`}
            subtitle="Promedio total"
            icon={TrendingUp}
            color="#2E8B57"
          />
          <StatCard
            title="Medicamentos Activos"
            value={statistics.activeMedications}
            subtitle={`de ${statistics.totalMedications} total`}
            icon={Pill}
            color="#FF6B35"
          />
          <StatCard
            title="Racha Actual"
            value={`${statistics.currentStreak} días`}
            subtitle={`Máxima: ${statistics.longestStreak} días`}
            icon={Award}
            color="#4A90E2"
          />
          <StatCard
            title="Adherencia Semanal"
            value={`${statistics.weeklyAdherence}%`}
            subtitle="Esta semana"
            icon={Calendar}
            color="#F5A623"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Adherence Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Adherencia Diaria
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyAdherence}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: any) => [
                      `${Math.round(value)}%`,
                      "Adherencia",
                    ]}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="adherence"
                    stroke="#2E8B57"
                    strokeWidth={3}
                    dot={{ fill: "#2E8B57", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Medication Adherence Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Adherencia por Medicamento
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={medicationStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: any) => [
                      `${Math.round(value)}%`,
                      "Adherencia",
                    ]}
                  />
                  <Bar dataKey="adherence" fill="#2E8B57" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Medication Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Desglose por Medicamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Distribución de Adherencia
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={medicationStats as any}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="adherence"
                      label={({ name, value }: any) =>
                        `${name}: ${Math.round(value)}%`
                      }>
                      {medicationStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        `${Math.round(value)}%`,
                        "Adherencia",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Resumen por Medicamento
              </h4>
              <div className="space-y-4">
                {medicationStats.map((med, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: med.color }}
                      />
                      <span className="font-medium text-gray-900">
                        {med.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {Math.round(med.adherence)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {med.taken}/{med.total} dosis
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {intakeLogs
              .filter((log) => log.taken_at)
              .sort(
                (a, b) =>
                  parseISO(b.taken_at!).getTime() -
                  parseISO(a.taken_at!).getTime()
              )
              .slice(0, 5)
              .map((log, index) => {
                const medication = medications.find(
                  (med) => med.id === log.medication_id
                );
                if (!medication) return null;

                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {medication.generic_name} - {log.dose_amount}{" "}
                        {medication.dosage_unit}
                      </div>
                      <div className="text-sm text-gray-600">
                        {format(parseISO(log.taken_at!), "dd/MM/yyyy HH:mm", {
                          locale: es,
                        })}
                      </div>
                    </div>
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                );
              })}
            {intakeLogs.filter((log) => log.taken_at).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay actividad reciente</p>
                <p className="text-sm">
                  Comienza a registrar tus medicamentos para ver tu progreso
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
