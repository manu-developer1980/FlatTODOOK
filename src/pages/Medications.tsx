import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pill, Clock, Calendar, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { db } from '../lib/supabase';
import { Medication, Patient } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { toast } from 'sonner';

export default function Medications() {
  const { user } = useAuthStore();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadMedications();
  }, [user]);

  const loadMedications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get patient profile first
      const { data: patientData, error: patientError } = await db.getUser(user.user_id);
      if (patientData && !patientError) {
        setPatient(patientData as any);
        
        // Get medications for this patient
        const { data: medsData, error: medsError } = await db.getMedications(user.user_id, true);
        if (!medsError) {
          setMedications(medsData || []);
        }
      }
    } catch (error) {
      console.error('Error loading medications:', error);
      toast.error('Error al cargar medicamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (medicationId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este medicamento?')) return;

    try {
      await db.deleteMedication(medicationId);
      toast.success('Medicamento eliminado correctamente');
      loadMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast.error('Error al eliminar medicamento');
    }
  };

  const filteredMedications = medications.filter(med => {
    const matchesSearch = med.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (med.brand && med.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'active' && med.is_active) ||
                         (filterType === 'inactive' && !med.is_active);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mis Medicamentos</h1>
          <p className="text-xl text-gray-600">Gestiona tus medicamentos y horarios de forma sencilla</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Buscar medicamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  aria-label="Buscar medicamentos"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="lg:w-64">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                aria-label="Filtrar medicamentos"
              >
                <option value="all">Todos los medicamentos</option>
                <option value="active">Medicamentos activos</option>
                <option value="inactive">Medicamentos inactivos</option>
              </select>
            </div>

            {/* Add Button */}
            <Link
              to="/medications/add"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-lg flex items-center gap-2 transition-colors min-h-[44px]"
              aria-label="Añadir nuevo medicamento"
            >
              <Plus className="w-6 h-6" />
              Añadir Medicamento
            </Link>
          </div>
        </div>

        {/* Medications Grid */}
        {filteredMedications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {medications.length === 0 ? 'No tienes medicamentos registrados' : 'No se encontraron medicamentos'}
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              {medications.length === 0 
                ? 'Comienza añadiendo tu primer medicamento para gestionar tus tratamientos' 
                : 'Intenta ajustar los filtros de búsqueda'}
            </p>
            {medications.length === 0 && (
              <Link
                to="/medications/add"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg inline-flex items-center gap-2 transition-colors min-h-[44px]"
              >
                <Plus className="w-6 h-6" />
                Añadir Primer Medicamento
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMedications.map((medication) => (
              <div
                key={medication.id}
                className={`bg-white rounded-lg shadow-sm p-6 border-2 transition-all hover:shadow-md ${
                  medication.is_active ? 'border-green-200 hover:border-green-300' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Medication Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {medication.generic_name}
                    </h3>
                    {medication.brand && (
                      <p className="text-gray-600 text-base">{medication.brand}</p>
                    )}
                  </div>
                  <div className={`w-4 h-4 rounded-full ml-3 flex-shrink-0 ${
                    medication.is_active ? 'bg-green-500' : 'bg-gray-400'
                  }`} 
                       aria-label={medication.is_active ? 'Activo' : 'Inactivo'}
                  />
                </div>

                {/* Dosage Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Pill className="w-5 h-5 text-green-600" />
                    <span className="text-base font-medium">
                      {medication.dosage}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="text-base">
                      {medication.frequency === 'daily' && 'Una vez al día'}
                      {medication.frequency === 'twice_daily' && 'Dos veces al día'}
                      {medication.frequency === 'three_times_daily' && 'Tres veces al día'}
                      {medication.frequency === 'four_times_daily' && 'Cuatro veces al día'}
                      {medication.frequency === 'every_4_hours' && 'Cada 4 horas'}
                      {medication.frequency === 'every_6_hours' && 'Cada 6 horas'}
                      {medication.frequency === 'every_8_hours' && 'Cada 8 horas'}
                      {medication.frequency === 'every_12_hours' && 'Cada 12 horas'}
                      {medication.frequency === 'weekly' && 'Semanalmente'}
                      {medication.frequency === 'monthly' && 'Mensualmente'}
                      {medication.frequency === 'as_needed' && 'Cuando sea necesario'}
                    </span>
                  </div>
                  {medication.start_date && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span className="text-base">
                        Desde {new Date(medication.start_date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                  {medication.end_date && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span className="text-base">
                        Hasta {new Date(medication.end_date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Specific Times */}
                {medication.specific_times && medication.specific_times.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Horarios:</h4>
                    <div className="space-y-1">
                      {medication.specific_times.slice(0, 3).map((time, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{time}</span>
                        </div>
                      ))}
                      {medication.specific_times.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{medication.specific_times.length - 3} horarios más
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Link
                    to={`/medications/edit/${medication.id}`}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium text-base flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                    aria-label={`Editar ${medication.generic_name}`}
                  >
                    <Edit2 className="w-5 h-5" />
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(medication.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-3 rounded-lg font-medium text-base flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                    aria-label={`Eliminar ${medication.generic_name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {medications.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Resumen de Medicamentos</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {medications.filter(m => m.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Activos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {medications.filter(m => !m.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Inactivos</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {medications.reduce((total, med) => total + (med.specific_times?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Horarios totales</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {medications.length}
                </div>
                <div className="text-sm text-gray-600">Total medicamentos</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
