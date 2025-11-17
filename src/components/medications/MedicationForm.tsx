import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Minus, Clock, Pill, Save, X } from "lucide-react";
import { useAuthStore } from "../../stores/auth";
import { db } from "../../lib/supabase";
import { Medication, MedicationFormData, Patient } from "../../types";
import { toast } from "sonner";

const dosageUnits = [
  { value: "mg", label: "mg (miligramos)" },
  { value: "g", label: "g (gramos)" },
  { value: "ml", label: "ml (mililitros)" },
  { value: "gotas", label: "Gotas" },
  { value: "cucharadas", label: "Cucharadas" },
  { value: "cucharaditas", label: "Cucharaditas" },
  { value: "comprimidos", label: "Comprimidos" },
  { value: "cápsulas", label: "Cápsulas" },
  { value: "inyecciones", label: "Inyecciones" },
];

const medicationForms = [
  { value: "tablet", label: "Tableta" },
  { value: "capsule", label: "Cápsula" },
  { value: "liquid", label: "Líquido" },
  { value: "injection", label: "Inyección" },
  { value: "cream", label: "Crema" },
  { value: "ointment", label: "Pomada" },
  { value: "inhaler", label: "Inhalador" },
  { value: "drops", label: "Gotas" },
  { value: "patch", label: "Parche" },
  { value: "suppository", label: "Supositorio" },
];

const frequencyTypes = [
  { value: "daily", label: "Una vez al día" },
  { value: "twice_daily", label: "Dos veces al día" },
  { value: "three_times_daily", label: "Tres veces al día" },
  { value: "four_times_daily", label: "Cuatro veces al día" },
  { value: "every_4_hours", label: "Cada 4 horas" },
  { value: "every_6_hours", label: "Cada 6 horas" },
  { value: "every_8_hours", label: "Cada 8 horas" },
  { value: "every_12_hours", label: "Cada 12 horas" },
  { value: "weekly", label: "Una vez por semana" },
  { value: "monthly", label: "Una vez por mes" },
  { value: "as_needed", label: "Cuando sea necesario" },
];

export default function MedicationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<MedicationFormData>({
    generic_name: "",
    brand: "",
    strength: "",
    form: "tablet",
    dosage: "",
    frequency: "daily",
    specific_times: ["09:00"],
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    instructions: "",
    prescribed_by: "",
    pharmacy_name: "",
    pharmacy_phone: "",
    refill_quantity: 0,
    refill_remaining: 0,
  });

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      loadMedication();
    }
    loadPatient();
  }, [id, user]);

  const loadPatient = async () => {
    if (!user) return;

    try {
      const response = await db.getUser(
        user.user_id
      );
      if ((response as any).data) {
        setPatient((response as any).data);
      }
    } catch (error) {
      console.error("Error loading patient:", error);
    }
  };

  const loadMedication = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const response = await db.getMedication(id);
      if ((response as any).data) {
        const medication = (response as any).data;
        setFormData({
          generic_name: medication.generic_name,
          brand: medication.brand || "",
          strength: medication.strength || "",
          form: medication.form,
          dosage: medication.dosage,
          frequency: medication.frequency,
          specific_times: medication.specific_times || ["09:00"],
          start_date:
            medication.start_date?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          end_date: medication.end_date?.split("T")[0] || "",
          instructions: medication.instructions || "",
          prescribed_by: medication.prescribed_by || "",
          pharmacy_name: medication.pharmacy_name || "",
          pharmacy_phone: medication.pharmacy_phone || "",
          refill_quantity: medication.refill_quantity || 0,
          refill_remaining: medication.refill_remaining || 0,
        });
      }
    } catch (error) {
      console.error("Error loading medication:", error);
      toast.error("Error al cargar el medicamento");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patient) return;

    try {
      setLoading(true);

      const medicationData = {
        ...formData,
        patient_id: patient.id,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        is_active: true,
      };

      if (isEdit && id) {
        const response = await db.updateMedication(
          id,
          medicationData
        );
        if (response.data) {
          toast.success("Medicamento actualizado correctamente");
        } else {
          throw new Error("Error al actualizar medicamento");
        }
      } else {
        const response = await db.createMedication(
          user!.user_id,
          medicationData
        );
        if (response.data) {
          toast.success("Medicamento creado correctamente");
        } else {
          throw new Error("Error al crear medicamento");
        }
      }

      navigate("/medications");
    } catch (error) {
      console.error("Error saving medication:", error);
      toast.error("Error al guardar el medicamento");
    } finally {
      setLoading(false);
    }
  };

  const addTime = () => {
    setFormData((prev) => ({
      ...prev,
      specific_times: [...prev.specific_times, "09:00"],
    }));
  };

  const removeTime = (index: number) => {
    if (formData.specific_times.length > 1) {
      setFormData((prev) => ({
        ...prev,
        specific_times: prev.specific_times.filter((_, i) => i !== index),
      }));
    }
  };

  const updateTime = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      specific_times: prev.specific_times.map((time, i) =>
        i === index ? value : time
      ),
    }));
  };

  const generateTimes = () => {
    let times: string[] = [];

    switch (formData.frequency) {
      case "daily":
        times = ["09:00"];
        break;
      case "twice_daily":
        times = ["08:00", "20:00"];
        break;
      case "three_times_daily":
        times = ["08:00", "14:00", "20:00"];
        break;
      case "four_times_daily":
        times = ["08:00", "12:00", "16:00", "20:00"];
        break;
      case "every_4_hours": {
        const list: string[] = [];
        for (let h = 8; h < 24; h += 4) list.push(`${h.toString().padStart(2, "0")}:00`);
        times = list;
        break;
      }
      case "every_6_hours": {
        const list: string[] = [];
        for (let h = 8; h < 24; h += 6) list.push(`${h.toString().padStart(2, "0")}:00`);
        times = list;
        break;
      }
      case "every_8_hours": {
        const list: string[] = [];
        for (let h = 8; h < 24; h += 8) list.push(`${h.toString().padStart(2, "0")}:00`);
        times = list;
        break;
      }
      case "every_12_hours":
        times = ["08:00", "20:00"];
        break;
      case "weekly":
        times = ["09:00"];
        break;
      case "monthly":
        times = ["09:00"];
        break;
      default:
        times = formData.specific_times;
    }

    setFormData((prev) => ({ ...prev, specific_times: times }));
  };

  useEffect(() => {
    if ((formData.frequency as string) !== "as_needed") {
      generateTimes();
    }
  }, [formData.frequency]);

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
            {isEdit ? "Editar Medicamento" : "Añadir Nuevo Medicamento"}
          </h1>
          <p className="text-xl text-gray-600">
            {isEdit
              ? "Actualiza la información de tu medicamento"
              : "Registra un nuevo medicamento con sus horarios y detalles"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <Pill className="w-6 h-6 text-green-600" />
              Información Básica
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generic Name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="generic_name"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Nombre Genérico *
                </label>
                <input
                  type="text"
                  id="generic_name"
                  required
                  value={formData.generic_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      generic_name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: Paracetamol, Ibuprofeno..."
                  aria-describedby="generic-name-help"
                />
                <p
                  id="generic-name-help"
                  className="mt-2 text-sm text-gray-500"
                >
                  Escribe el nombre genérico del medicamento
                </p>
              </div>

              {/* Brand */}
              <div className="md:col-span-1">
                <label
                  htmlFor="brand"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Marca
                </label>
                <input
                  type="text"
                  id="brand"
                  value={formData.brand || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, brand: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Tylenol, Advil..."
                />
              </div>

              {/* Prescribed By */}
              <div className="md:col-span-1">
                <label
                  htmlFor="prescribed_by"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Médico que lo recetó
                </label>
                <input
                  type="text"
                  id="prescribed_by"
                  value={formData.prescribed_by || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      prescribed_by: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Dr. García, Dra. Martínez..."
                />
              </div>

              {/* Form */}
              <div>
                <label
                  htmlFor="form"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Forma del Medicamento
                </label>
                <select
                  id="form"
                  value={formData.form}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      form: e.target.value as Medication["form"],
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {medicationForms.map((form) => (
                    <option
                      key={form.value}
                      value={form.value}
                    >
                      {form.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Strength */}
              <div>
                <label
                  htmlFor="strength"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Concentración
                </label>
                <input
                  type="text"
                  id="strength"
                  required
                  value={formData.strength}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      strength: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="500mg, 10ml, etc."
                  aria-describedby="strength-help"
                />
                <p
                  id="strength-help"
                  className="mt-2 text-sm text-gray-500"
                >
                  Ej: 500mg, 10ml, 5%
                </p>
              </div>

              {/* Dosage */}
              <div className="md:col-span-2">
                <label
                  htmlFor="dosage"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Dosis *
                </label>
                <input
                  type="text"
                  id="dosage"
                  required
                  value={formData.dosage}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dosage: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="1 comprimido, 2 cápsulas, 10ml, etc."
                  aria-describedby="dosage-help"
                />
                <p
                  id="dosage-help"
                  className="mt-2 text-sm text-gray-500"
                >
                  Ej: 1 comprimido, 2 cápsulas, 10ml
                </p>
              </div>

              {/* Pharmacy Name */}
              <div className="md:col-span-1">
                <label
                  htmlFor="pharmacy_name"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Farmacia
                </label>
                <input
                  type="text"
                  id="pharmacy_name"
                  value={formData.pharmacy_name || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pharmacy_name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Farmacia Central, Farmacia 24h..."
                />
              </div>

              {/* Pharmacy Phone */}
              <div className="md:col-span-1">
                <label
                  htmlFor="pharmacy_phone"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Teléfono de Farmacia
                </label>
                <input
                  type="tel"
                  id="pharmacy_phone"
                  value={formData.pharmacy_phone || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pharmacy_phone: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+34 91 123 4567"
                />
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
              {/* Frequency */}
              <div className="md:col-span-2">
                <label
                  htmlFor="frequency"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Frecuencia de Toma *
                </label>
                <select
                  id="frequency"
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      frequency: e.target.value as Medication["frequency"],
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  aria-describedby="frequency-help"
                >
                  {frequencyTypes.map((freq) => (
                    <option
                      key={freq.value}
                      value={freq.value}
                    >
                      {freq.label}
                    </option>
                  ))}
                </select>
                <p
                  id="frequency-help"
                  className="mt-2 text-sm text-gray-500"
                >
                  Selecciona con qué frecuencia se debe tomar este medicamento
                </p>
              </div>

              {/* Date Range */}
              <div>
                <label
                  htmlFor="start_date"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  id="start_date"
                  required
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="end_date"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Fecha de Fin (Opcional)
                </label>
                <input
                  type="date"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  aria-describedby="end-date-help"
                />
                <p
                  id="end-date-help"
                  className="mt-2 text-sm text-gray-500"
                >
                  Déjalo vacío si el tratamiento es continuo
                </p>
              </div>
            </div>

            {/* Custom Schedules */}
            {(formData.frequency as string) !== "as_needed" && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Horarios
                  </h3>
                  <button
                    type="button"
                    onClick={addTime}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors min-h-[44px]"
                  >
                    <Plus className="w-5 h-5" />
                    Añadir Horario
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.specific_times.map((time, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora
                        </label>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => updateTime(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>
                      {formData.specific_times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTime(index)}
                          className="mt-6 bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors min-h-[44px]"
                          aria-label="Eliminar horario"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {(formData.frequency as string) === "as_needed" && (
                  <p className="mt-4 text-sm text-gray-500">
                    Este medicamento se toma cuando sea necesario. Puedes añadir
                    notas sobre cuándo tomarlo.
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
              {/* Instructions */}
              <div>
                <label
                  htmlFor="instructions"
                  className="block text-lg font-medium text-gray-700 mb-3"
                >
                  Instrucciones
                </label>
                <textarea
                  id="instructions"
                  value={formData.instructions || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder="¿Alguna información importante sobre este medicamento?"
                  aria-describedby="instructions-help"
                />
                <p
                  id="instructions-help"
                  className="mt-2 text-sm text-gray-500"
                >
                  Ej: "Tomar con comida", "Evitar alcohol", "Guardar en nevera"
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate("/medications")}
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
              {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
