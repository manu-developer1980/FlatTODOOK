import { useEffect, useState } from 'react';
import { Pill, Clock, CheckCircle, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { db } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Dashboard() {
  const { user } = useAuthStore();
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
        const { data: statsData } = await db.getAdherenceStats(user.id, 'week');
        if (statsData && statsData.length > 0) {
          const recentStats = statsData[statsData.length - 1];
          setStatistics(recentStats);
        }
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const pendingMedications = todaySchedule.filter(med => med.status === 'pending');
  const takenMedications = todaySchedule.filter(med => med.status === 'taken');
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
              ¡Hola, {user?.full_name?.split(' ')[0] || 'Usuario'}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
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
              <p className="text-2xl font-bold text-gray-900">{todaySchedule.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{takenMedications.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{pendingMedications.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{statistics?.streak_days || 0} días</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Medications */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Medicaciones de Hoy</h2>
          <span className="text-sm text-gray-500">
            {takenMedications.length} de {todaySchedule.length} completadas
          </span>
        </div>

        {todaySchedule.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay medicaciones programadas para hoy</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaySchedule.map((medication) => (
              <div
                key={medication.id}
                className={`p-4 rounded-lg border-2 ${
                  medication.status === 'taken'
                    ? 'bg-green-50 border-green-200'
                    : medication.status === 'pending'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`rounded-full p-2 ${
                      medication.status === 'taken'
                        ? 'bg-green-100'
                        : medication.status === 'pending'
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}>
                      {medication.status === 'taken' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Clock className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {medication.medications.name}
                      </h3>
                      <p className="text-gray-600">
                        {medication.dose_amount} - {new Date(medication.scheduled_time).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {medication.status === 'taken' ? (
                      <span className="text-green-600 font-semibold">Tomada</span>
                    ) : medication.status === 'pending' ? (
                      <button className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
                        Tomar
                      </button>
                    ) : (
                      <span className="text-gray-600">Omitida</span>
                    )}
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
            <h3 className="text-xl font-bold text-gray-900">Añadir Medicación</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Registra una nueva medicación en tu tratamiento
          </p>
          <button className="btn-primary w-full">
            Nueva Medicación
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="w-8 h-8 text-secondary mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Invitar Cuidador</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Añade a un familiar o amigo para que te ayude
          </p>
          <button className="btn-secondary w-full">
            Invitar Cuidador
          </button>
        </div>
      </div>
    </div>
  );
}