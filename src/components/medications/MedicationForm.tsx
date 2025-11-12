import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Minus, Clock, Pill, Save, X } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { createMedication, updateMedication, getMedication } from '../../lib/supabase';
import { Medication, MedicationSchedule } from '../../types';
import { toast } from 'sonner';

interface MedicationFormData {
  name: string;
  description: string;
  dosage_amount: number;
  dosage_unit: string;
  form: string;
  frequency_type: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  notes?: string;
  schedules: MedicationSchedule[];
}

const dosageUnits = [
  { value: 'mg', label: 'mg (miligramos)' },
  { value: 'g', label: 'g (gramos)' },
  { value: 'ml', label: 'ml (mililitros)' },
  { value: 'gotas', label: 'Gotas' },
  { value: 'cucharadas', label: 'Cucharadas' },
  { value: 'cucharaditas', label: 'Cucharaditas' },
  { value: 'comprimidos', label: 'Comprimidos' },
  { value: 'cápsulas', label: 'Cápsulas' },
  { value: 'inyecciones', label: 'Inyecciones' },
];

const medicationForms = [
  { value: 'pill', label: 'Pastilla/Comprimido' },
  { value: 'capsule', label: 'Cápsula' },
  { value: 'liquid', label: 'Líquido' },
  { value: 'injection', label: 'Inyección' },
  { value: 'drops', label: 'Gotas' },
  { value: 'cream', label: 'Crema' },
  { value: 'ointment', label: 'Pomada' },
  { value: 'inhaler', label: 'Inhalador' },
  { value: 'patch', label: 'Parche' },
];

const frequencyTypes = [
  { value: 'daily', label: 'Una vez al día' },
  { value: 'twice_daily', label: 'Dos veces al día' },
  { value: 'three_times_daily', label: 'Tres veces al día' },
  { value: 'four_times_daily', label: 'Cuatro veces al día' },
  { value: 'as_needed', label: 'Cuando sea necesario' },
  { value: 'custom', label: 'Horario personalizado' },
];

export default function MedicationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<MedicationFormData>({
    name: '',
    description: '',
    dosage_amount: 1,
    dosage_unit: 'comprimidos',
    form: 'pill',
    frequency_type: 'daily',
    start_date: new Date().toISOString().split('T')[0],
    is_active: true,
    schedules: [{ time: '09:00', dose: '1' }],
  });

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      loadMedication();
    }
  }, [id]);

  const loadMedication = async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);
      const medication = await getMedication(id);
      if (medication && medication.user_id === user.id) {
        setFormData({
          name: medication.name,
          description: medication.description,
          dosage_amount: medication.dosage_amount,
          dosage_unit: medication.dosage_unit,
          form: medication.form,
          frequency_type: medication.frequency_type,
          start_date: medication.start_date?.split('T')[0] || '',
          end_date: medication.end_date?.split('T')[0] || '',
          is_active: medication.is_active,
          notes: medication.notes || '',
          schedules: medication.schedules || [{ time: '09:00', dose: '1' }],
        });
      }
    } catch (error) {
      console.error('Error loading medication:', error);
      toast.error('Error al cargar el medicamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      
      const medicationData = {
        ...formData,
        user_id: user.id,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
      };

      if (isEdit && id) {
        await updateMedication(id, medicationData);
        toast.success('Medicamento actualizado correctamente');
      } else {
        await createMedication(medicationData);
        toast.success('Medicamento creado correctamente');
      }
      
      navigate('/medications');
    } catch (error) {
      console.error('Error saving medication:', error);
      toast.error('Error al guardar el medicamento');
    } finally {
      setLoading(false);
    }
  };

  const addSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, { time: '09:00', dose: '1' }]
    }));
  };

  const removeSchedule = (index: number) => {
    if (formData.schedules.length > 1) {
      setFormData(prev => ({
        ...prev,
        schedules: prev.schedules.filter((_, i) => i !== index)
      }));
    }
  };

  const updateSchedule = (index: number, field: 'time' | 'dose', value: string) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.map((schedule, i) => 
        i === index ? { ...schedule, [field]: value } : schedule
      )
    }));
  };

  const generateSchedules = () => {
    let schedules: MedicationSchedule[] = [];
    
    switch (formData.frequency_type) {
      case 'daily':
        schedules = [{ time: '09:00', dose: '1' }];
        break;
      case 'twice_daily':
        schedules = [
          { time: '08:00', dose: '1' },
          { time: '20:00', dose: '1' }
        ];
        break;
      case 'three_times_daily':
        schedules = [
          { time: '08:00', dose: '1' },
          { time: '14:00', dose: '1' },
          { time: '20:00', dose: '1' }
        ];
        break;
      case 'four_times_daily':
        schedules = [
          { time: '08:00', dose: '1' },
          { time: '12:00', dose: '1' },
          { time: '16:00', dose: '1' },
          { time: '20:00', dose: '1' }
        ];
        break;
      default:
        schedules = formData.schedules;
    }
    
    setFormData(prev => ({ ...prev, schedules }));
  };

  useEffect(() => {
    if (formData.frequency_type !== 'as_needed' && formData.frequency_type !== 'custom') {
      generateSchedules();
    }
  }, [formData.frequency_type]);

  if (loading && isEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Pill className="w-12 h-12 text-green-600 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-600">Cargando medicamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isEdit ? 'Editar Medicamento' : 'Añadir Nuevo Medicamento'}
          </h1>
          <p className="text-xl text-gray-600">
            {isEdit 
              ? 'Actualiza la información de tu medicamento' 
              : 'Registra un nuevo medicamento con sus horarios y detalles'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <Pill className="w-6 h-6 text-green-600" />
              Información Básica
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-3">
                  Nombre del Medicamento *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: Paracetamol, Ibuprofeno..."
                  aria-describedby="name-help"
                />
                <p id="name-help" className="mt-2 text-sm text-gray-500">
                  Escribe el nombre común o la marca del medicamento
                </p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-lg font-medium text-gray-700 mb-3">
                  Descripción *
                </label>
                <textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="¿Para qué sirve este medicamento?"
                  aria-describedby="description-help"
                />
                <p id="description-help" className="mt-2 text-sm text-gray-500">
                  Describe brevemente el propósito del medicamento
                </p>
              </div>

              {/* Form */}
              <div>
                <label htmlFor="form" className="block text-lg font-medium text-gray-700 mb-3">
                  Forma del Medicamento
                </label>
                <select
                  id="form"
                  value={formData.form}
                  onChange={(e) => setFormData(prev => ({ ...prev, form: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {medicationForms.map(form => (
                    <option key={form.value} value={form.value}>{form.label}</option>
                  ))}
                </select>
              </div>

              {/* Dosage Amount */}
              <div>
                <label htmlFor="dosage_amount" className="block text-lg font-medium text-gray-700 mb-3">
                  Cantidad por Dosis
                </label>
                <input
                  type="number"
                  id="dosage_amount"
                  min="0.1"
                  step="0.1"
                  value={formData.dosage_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage_amount: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  aria-describedby="dosage-help"
                />
              </div>

              {/* Dosage Unit */}
              <div>
                <label htmlFor="dosage_unit" className="block text-lg font-medium text-gray-700 mb-3">
                  Unidad de Medida
                </label>
                <select
                  id="dosage_unit"
                  value={formData.dosage_unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage_unit: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {dosageUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
                <p id="dosage-help" className="mt-2 text-sm text-gray-500">
                  Ej: 1 comprimido, 500mg, 10ml
                </p>
              </div>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <Clock className="w-6 h-6 text-green-600" />
              Frecuencia y Horarios
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Frequency Type */}
              <div className="md:col-span-2">
                <label htmlFor="frequency_type" className="block text-lg font-medium text-gray-700 mb-3">
                  Frecuencia de Toma *
                </label>
                <select
                  id="frequency_type"
                  value={formData.frequency_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency_type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  aria-describedby="frequency-help"
                >
                  {frequencyTypes.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
                <p id="frequency-help" className="mt-2 text-sm text-gray-500">
                  Selecciona con qué frecuencia se debe tomar este medicamento
                </p>
              </div>

              {/* Date Range */}
              <div>
                <label htmlFor="start_date" className="block text-lg font-medium text-gray-700 mb-3">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  id="start_date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-lg font-medium text-gray-700 mb-3">
                  Fecha de Fin (Opcional)
                </label>
                <input
                  type="date"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  aria-describedby="end-date-help"
                />
                <p id="end-date-help" className="mt-2 text-sm text-gray-500">
                  Déjalo vacío si el tratamiento es continuo
                </p>
              </div>
            </div>

            {/* Custom Schedules */}
            {(formData.frequency_type === 'custom' || formData.frequency_type === 'as_needed') && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Horarios Personalizados</h3>
                  {formData.frequency_type === 'custom' && (
                    <button
                      type="button"
                      onClick={addSchedule}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors min-h-[44px]"
                    >
                      <Plus className="w-5 h-5" />
                      Añadir Horario
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.schedules.map((schedule, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora
                        </label>
                        <input
                          type="time"
                          value={schedule.time}
                          onChange={(e) => updateSchedule(index, 'time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dosis
                        </label>
                        <input
                          type="text"
                          value={schedule.dose}
                          onChange={(e) => updateSchedule(index, 'dose', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Ej: 1, 500mg, 10ml"
                          required
                        />
                      </div>
                      {formData.schedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSchedule(index)}
                          className="mt-6 bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors min-h-[44px]"
                          aria-label="Eliminar horario"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {formData.frequency_type === 'as_needed' && (
                  <p className="mt-4 text-sm text-gray-500">
                    Este medicamento se toma cuando sea necesario. Puedes añadir notas sobre cuándo tomarlo.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Información Adicional
            </h2>

            <div className="space-y-6">
              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-lg font-medium text-gray-700 mb-3">
                  Notas Adicionales
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder="¿Alguna información importante sobre este medicamento?"
                  aria-describedby="notes-help"
                />
                <p id="notes-help" className="mt-2 text-sm text-gray-500">
                  Ej: "Tomar con comida", "Evitar alcohol", "Guardar en nevera"
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="is_active" className="text-lg font-medium text-gray-700">
                  Este medicamento está activo
                </label>
              </div>
              <p className="text-sm text-gray-500 ml-8">
                Los medicamentos inactivos no generarán recordatorios
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/medications')}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 transition-colors min-h-[44px] disabled:opacity-50"
            >
              <X className="w-6 h-6" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 transition-colors min-h-[44px] disabled:opacity-50"
            >
              <Save className="w-6 h-6" />
              {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}