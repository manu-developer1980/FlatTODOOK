import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Edit2, Save, X } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { updateUserProfile } from '../lib/supabase';
import { toast } from 'sonner';

export default function Profile() {
  const { user, updateProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
    emergency_contact: '',
    emergency_phone: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        birth_date: user.user_metadata?.birth_date || '',
        emergency_contact: user.user_metadata?.emergency_contact || '',
        emergency_phone: user.user_metadata?.emergency_phone || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        birth_date: formData.birth_date,
        emergency_contact: formData.emergency_contact,
        emergency_phone: formData.emergency_phone
      });
      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Por favor, inicia sesión para ver tu perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mi Perfil</h1>
          <p className="text-xl text-gray-600">Gestiona tu información personal y preferencias</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {user.user_metadata?.full_name || 'Usuario'}
                </h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors min-h-[44px]"
              >
                <Edit2 className="w-5 h-5" />
                Editar Perfil
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="full_name" className="block text-lg font-medium text-gray-700 mb-3">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="full_name"
                  required
                  disabled={!isEditing}
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg disabled:bg-gray-100"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-3">
                  Correo electrónico *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    required
                    disabled
                    value={formData.email}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-lg"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">El email no se puede modificar</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-lg font-medium text-gray-700 mb-3">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    id="phone"
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg disabled:bg-gray-100"
                    placeholder="Tu número de teléfono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="birth_date" className="block text-lg font-medium text-gray-700 mb-3">
                  Fecha de nacimiento
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    id="birth_date"
                    disabled={!isEditing}
                    value={formData.birth_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Contacto de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="emergency_contact" className="block text-lg font-medium text-gray-700 mb-3">
                    Nombre del contacto
                  </label>
                  <input
                    type="text"
                    id="emergency_contact"
                    disabled={!isEditing}
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg disabled:bg-gray-100"
                    placeholder="Nombre de tu contacto de emergencia"
                  />
                </div>

                <div>
                  <label htmlFor="emergency_phone" className="block text-lg font-medium text-gray-700 mb-3">
                    Teléfono de emergencia
                  </label>
                  <input
                    type="tel"
                    id="emergency_phone"
                    disabled={!isEditing}
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg disabled:bg-gray-100"
                    placeholder="Teléfono de emergencia"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                  onClick={() => setIsEditing(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors min-h-[44px]"
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors min-h-[44px]"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Account Info */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Información de la Cuenta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">ID de Usuario:</span>
              <span className="ml-2 text-gray-600 font-mono">{user.id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Miembro desde:</span>
              <span className="ml-2 text-gray-600">
                {new Date(user.created_at).toLocaleDateString('es-ES')}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Último acceso:</span>
              <span className="ml-2 text-gray-600">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES') : 'Nunca'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email verificado:</span>
              <span className="ml-2 text-gray-600">
                {user.email_confirmed_at ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}