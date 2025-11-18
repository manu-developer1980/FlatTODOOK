import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import SubscriptionManager from '@/components/SubscriptionManager'
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Users, 
  Palette,
  Globe,
  Save,
  LogOut,
  Settings as SettingsIcon
} from 'lucide-react'
import { toast } from 'sonner'

export default function Settings() {
  const { user, signOut } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const location = useLocation()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    const stateTab = (location.state as any)?.activeTab
    const target = tabParam || stateTab
    if (target && ['profile','notifications','privacy','subscription','caregivers','appearance','language'].includes(target)) {
      setActiveTab(target)
    }
  }, [location, searchParams])

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate saving
    setTimeout(() => {
      setIsSaving(false)
      toast.success('Configuración guardada')
    }, 1000)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Sesión cerrada correctamente')
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'privacy', name: 'Privacidad', icon: Shield },
    { id: 'subscription', name: 'Suscripción', icon: CreditCard },
    { id: 'caregivers', name: 'Cuidadores', icon: Users },
    { id: 'appearance', name: 'Apariencia', icon: Palette },
    { id: 'language', name: 'Idioma', icon: Globe }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.user_metadata?.full_name || ''}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Médica</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condiciones médicas
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describa sus condiciones médicas principales..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alergias
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Liste sus alergias..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferencias de Notificaciones</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Recordatorios de medicación</h4>
                    <p className="text-sm text-gray-600">Recibir notificaciones cuando sea hora de tomar medicamentos</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5 text-primary rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Alertas de cuidadores</h4>
                    <p className="text-sm text-gray-600">Notificar a cuidadores si no tomo medicación</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5 text-primary rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Logros y recompensas</h4>
                    <p className="text-sm text-gray-600">Notificaciones sobre insignias y rachas</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5 text-primary rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Notificaciones por correo</h4>
                    <p className="text-sm text-gray-600">Recibir recordatorios por correo electrónico</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 text-primary rounded" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Horario de Notificaciones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de inicio
                  </label>
                  <input
                    type="time"
                    defaultValue="08:00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de fin
                  </label>
                  <input
                    type="time"
                    defaultValue="22:00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacidad y Seguridad</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Perfil privado</h4>
                    <p className="text-sm text-gray-600">Solo cuidadores autorizados pueden ver mi información</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5 text-primary rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Autenticación de dos factores</h4>
                    <p className="text-sm text-gray-600">Añadir capa extra de seguridad a mi cuenta</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 text-primary rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Historial de acceso</h4>
                    <p className="text-sm text-gray-600">Recibir alertas sobre nuevos accesos a mi cuenta</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5 text-primary rounded" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compartir Datos</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Compartir con médicos</h4>
                    <p className="text-sm text-gray-600">Permitir acceso a mi historial médico a profesionales</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 text-primary rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Anónimo para investigación</h4>
                    <p className="text-sm text-gray-600">Compartir datos anónimos para investigación médica</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 text-primary rounded" />
                </div>
              </div>
            </div>
          </div>
        )



      case 'caregivers':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Mis Cuidadores</h3>
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                Invitar Cuidador
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No hay cuidadores</h4>
              <p className="text-gray-600 mb-4">Invita a familiares o amigos para que te ayuden con el seguimiento de tus medicaciones.</p>
              <button className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors">
                Invitar Primer Cuidador
              </button>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Cómo funciona</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Los cuidadores reciben notificaciones cuando no tomas tus medicamentos</p>
                <p>• Pueden ver tu calendario de medicaciones</p>
                <p>• Reciben actualizaciones sobre tu progreso</p>
                <p>• Tú controlas quién puede acceder a tu información</p>
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tamaño de Texto</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño de fuente
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg">
                    <option>Normal</option>
                    <option>Grande</option>
                    <option>Muy Grande</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contraste</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Alto contraste</h4>
                    <p className="text-sm text-gray-600">Mejora la legibilidad con colores más contrastados</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 text-primary rounded" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Modo de Color</h3>
              <div className="grid grid-cols-3 gap-4">
                <button className="p-4 border-2 border-primary rounded-lg bg-white">
                  <div className="w-full h-8 bg-primary rounded mb-2"></div>
                  <span className="text-sm font-medium">Claro</span>
                </button>
                <button className="p-4 border-2 border-gray-300 rounded-lg bg-gray-900 text-white">
                  <div className="w-full h-8 bg-gray-700 rounded mb-2"></div>
                  <span className="text-sm font-medium">Oscuro</span>
                </button>
                <button className="p-4 border-2 border-gray-300 rounded-lg bg-blue-900 text-white">
                  <div className="w-full h-8 bg-blue-700 rounded mb-2"></div>
                  <span className="text-sm font-medium">Azul Oscuro</span>
                </button>
              </div>
            </div>
          </div>
        )

      case 'subscription':
        return <SubscriptionManager />

      case 'language':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Idioma</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma de la aplicación
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="ca">Català</option>
                    <option value="eu">Euskara</option>
                    <option value="gl">Galego</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración Regional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de fecha
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg">
                    <option>DD/MM/AAAA</option>
                    <option>MM/DD/AAAA</option>
                    <option>AAAA-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de hora
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg">
                    <option>24 horas</option>
                    <option>12 horas (AM/PM)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <div>Configuración no disponible</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary p-3 rounded-full">
              <SettingsIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
              <p className="text-gray-600">Personaliza tu experiencia en MediTrack</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{tab.name}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {renderTabContent()}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>

              <div className="flex items-center gap-3">
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  <span className="font-medium">
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}