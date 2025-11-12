import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Pill, Clock, CheckCircle, Circle } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { getMedications, getMedicationLogs, createMedicationLog } from '../lib/supabase';
import { NotificationService } from '../services/notificationService';
import { Medication, MedicationLog } from '../types';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface DaySchedule {
  date: Date;
  medications: {
    medication: Medication;
    schedule: any;
    taken: boolean;
    log?: MedicationLog;
  }[];
}

export default function Calendar() {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);

  useEffect(() => {
    loadData();
  }, [user, currentDate]);

  useEffect(() => {
    generateWeekSchedule();
  }, [medications, medicationLogs, currentDate]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [medsData, logsData] = await Promise.all([
        getMedications(user.id),
        getMedicationLogs(user.id)
      ]);
      
      setMedications(medsData?.filter(med => med.is_active) || []);
      setMedicationLogs(logsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos del calendario');
    } finally {
      setLoading(false);
    }
  };

  const generateWeekSchedule = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    
    const schedule: DaySchedule[] = [];
    let current = start;
    
    while (current <= end) {
      const dayMeds: DaySchedule['medications'] = [];
      
      medications.forEach(medication => {
        if (medication.schedules) {
          medication.schedules.forEach(scheduleItem => {
            const isTaken = medicationLogs.some(log => 
              log.medication_id === medication.id && 
              isSameDay(parseISO(log.scheduled_date), current) &&
              log.taken_at
            );
            
            const log = medicationLogs.find(log => 
              log.medication_id === medication.id && 
              isSameDay(parseISO(log.scheduled_date), current) &&
              log.time === scheduleItem.time
            );
            
            dayMeds.push({
              medication,
              schedule: scheduleItem,
              taken: !!log?.taken_at,
              log
            });
          });
        }
      });
      
      schedule.push({
        date: new Date(current),
        medications: dayMeds.sort((a, b) => a.schedule.time.localeCompare(b.schedule.time))
      });
      
      current = addDays(current, 1);
    }
    
    setWeekSchedule(schedule);
  };

  const handleMarkAsTaken = async (medicationId: string, date: Date, time: string) => {
    if (!user) return;

    try {
      // Get medication details for notification
      const medication = medications.find(med => med.id === medicationId);
      if (!medication) {
        toast.error('Medicamento no encontrado');
        return;
      }

      const logData = {
        user_id: user.id,
        medication_id: medicationId,
        scheduled_date: format(date, 'yyyy-MM-dd'),
        time: time,
        taken_at: new Date().toISOString(),
        notes: 'Tomado desde el calendario'
      };

      await createMedicationLog(logData);
      
      // Create notification for medication taken
      await NotificationService.createMedicationTakenNotification(
        user.id,
        medication.name,
        medication.dosage
      );
      
      // Show browser notification
      NotificationService.showBrowserNotification(
        '✅ Medicación tomada',
        {
          body: `Has confirmado la toma de ${medication.name} (${medication.dosage})`,
          icon: '/meditrack-icon.svg',
          badge: '/meditrack-badge.svg'
        }
      );
      
      toast.success('Medicamento marcado como tomado');
      loadData();
    } catch (error) {
      console.error('Error marking as taken:', error);
      toast.error('Error al marcar como tomado');
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subDays(prev, 7) : addDays(prev, 7));
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Calendario de Medicamentos</h1>
          <p className="text-xl text-gray-600">Visualiza y gestiona tu horario semanal de medicamentos</p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateWeek('prev')}
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
                onClick={() => navigateWeek('next')}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-h-[44px]"
                aria-label="Semana siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMMM yyyy', { locale: es })}
              </h2>
              <p className="text-lg text-gray-600">
                Semana del {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd')} al {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd')}
              </p>
            </div>
          </div>
        </div>

        {/* Week View */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-0">
            {weekSchedule.map((day, index) => {
              const isToday = isSameDay(day.date, new Date());
              const isSelected = selectedDate && isSameDay(day.date, selectedDate);
              const hasMedications = day.medications.length > 0;
              const allTaken = day.medications.length > 0 && day.medications.every(med => med.taken);
              
              return (
                <div
                  key={index}
                  className={`border-r border-gray-200 last:border-r-0 ${
                    isToday ? 'bg-green-50' : isSelected ? 'bg-blue-50' : 'bg-white'
                  }`}
                >
                  {/* Day Header */}
                  <div
                    className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                      isToday ? 'bg-green-100' : isSelected ? 'bg-blue-100' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-500 mb-1">
                        {format(day.date, 'EEE', { locale: es })}
                      </div>
                      <div className={`text-2xl font-bold ${
                        isToday ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {format(day.date, 'd')}
                      </div>
                      {hasMedications && (
                        <div className="mt-2 flex justify-center">
                          {allTaken ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day Medications */}
                  <div className="p-4 min-h-[200px]">
                    {day.medications.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Sin medicamentos</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {day.medications.map((med, medIndex) => (
                          <div
                            key={medIndex}
                            className={`p-3 rounded-lg border transition-all ${
                              med.taken
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-600" />
                                <span className="font-semibold text-gray-900">
                                  {med.schedule.time}
                                </span>
                              </div>
                              {med.taken ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <button
                                  onClick={() => handleMarkAsTaken(med.medication.id, day.date, med.schedule.time)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors min-h-[32px]"
                                >
                                  Tomar
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Pill className="w-4 h-4 text-green-600" />
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {med.medication.name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {med.schedule.dose} {med.medication.dosage_unit}
                                </div>
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
              Detalles del {format(selectedDate, 'EEEE d \'de\' MMMM', { locale: es })}
            </h3>
            
            {(() => {
              const dayMeds = weekSchedule.find(day => isSameDay(day.date, selectedDate))?.medications || [];
              const takenCount = dayMeds.filter(med => med.taken).length;
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
                      {totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0}%
                    </div>
                  </div>
                  
                  {dayMeds.length > 0 && (
                    <div className="grid gap-3">
                      {dayMeds.map((med, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            med.taken
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              med.taken ? 'bg-green-600' : 'bg-gray-300'
                            }`}>
                              {med.taken ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : (
                                <Circle className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {med.medication.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {med.schedule.time} - {med.schedule.dose} {med.medication.dosage_unit}
                              </div>
                            </div>
                          </div>
                          {!med.taken && (
                            <button
                              onClick={() => handleMarkAsTaken(med.medication.id, selectedDate, med.schedule.time)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px]"
                            >
                              Marcar como tomado
                            </button>
                          )}
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
    </div>
  );
}