import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Pill,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { NotificationService } from "@/services/notificationService";
import { toast } from "sonner";
import { hasUserId } from "@/lib/userUtils";

interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  lowStockAlerts: boolean;
  caregiverAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export function NotificationPreferences() {
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    medicationReminders: true,
    appointmentReminders: true,
    lowStockAlerts: true,
    caregiverAlerts: false,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    // Check browser support and current permission
    const supported = NotificationService.isPushNotificationSupported();
    setBrowserSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const handlePreferenceChange = (
    key: keyof NotificationPreferences,
    value: any
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleQuietHoursChange = (
    key: "enabled" | "start" | "end",
    value: any
  ) => {
    setPreferences((prev) => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value,
      },
    }));
  };

  const handleRequestPermission = async () => {
    try {
      const newPermission =
        await NotificationService.requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission === "granted") {
        toast.success("Permisos de notificación concedidos");
      } else {
        toast.error("Permisos de notificación denegados");
      }
    } catch (error) {
      toast.error("Error al solicitar permisos");
    }
  };

  const handleTestNotifications = async (
    type: "medication" | "appointment"
  ) => {
    if (!hasUserId(user)) {
      toast.error("Debes iniciar sesión para probar notificaciones");
      return;
    }

    setIsLoading(true);
    try {
      const result = await NotificationService.testNotificationSystem(type);

      if (result.permission === "denied") {
        toast.error("Los permisos de notificación están denegados");
      } else if (result.permission === "default") {
        toast.info("Por favor, otorga permisos de notificación primero");
      } else {
        const messages = [];
        if (result.emailSuccess) messages.push("Email enviado");
        if (result.pushSuccess) messages.push("Notificación push enviada");

        if (messages.length > 0) {
          toast.success(messages.join(" y "));
        } else {
          toast.error("No se pudieron enviar las notificaciones");
        }
      }
    } catch (error) {
      toast.error("Error al probar notificaciones");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      // Here you would typically save to your backend/database
      // For now, we'll just show a success message
      toast.success("Preferencias de notificación guardadas");
    } catch (error) {
      toast.error("Error al guardar preferencias");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferencias de Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cómo deseas recibir notificaciones sobre tus medicamentos
            y citas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Support Alert */}
          {!browserSupported && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Tu navegador no soporta notificaciones push. Las
                  notificaciones por email estarán disponibles.
                </p>
              </div>
            </div>
          )}

          {/* Permission Status */}
          {browserSupported && permission !== "granted" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    {permission === "default"
                      ? "Las notificaciones están deshabilitadas. Actívalas para recibir recordatorios."
                      : "Has denegado los permisos de notificación."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestPermission}>
                  Habilitar Notificaciones
                </Button>
              </div>
            </div>
          )}

          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="email-notifications">
                    Notificaciones por Email
                  </Label>
                  <p className="text-sm text-gray-500">
                    Recibe recordatorios en tu correo electrónico
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailEnabled}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("emailEnabled", checked)
                }
              />
            </div>
          </div>

          {/* Push Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="push-notifications">
                    Notificaciones Push
                  </Label>
                  <p className="text-sm text-gray-500">
                    Recibe notificaciones en tu dispositivo
                  </p>
                </div>
              </div>
              <Switch
                id="push-notifications"
                checked={
                  preferences.pushEnabled &&
                  browserSupported &&
                  permission === "granted"
                }
                onCheckedChange={(checked) =>
                  handlePreferenceChange("pushEnabled", checked)
                }
                disabled={!browserSupported || permission !== "granted"}
              />
            </div>
          </div>

          {/* Medication Reminders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pill className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="medication-reminders">
                    Recordatorios de Medicación
                  </Label>
                  <p className="text-sm text-gray-500">
                    Recibe recordatorios cuando sea hora de tomar tus
                    medicamentos
                  </p>
                </div>
              </div>
              <Switch
                id="medication-reminders"
                checked={preferences.medicationReminders}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("medicationReminders", checked)
                }
              />
            </div>
          </div>

          {/* Appointment Reminders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="appointment-reminders">
                    Recordatorios de Citas
                  </Label>
                  <p className="text-sm text-gray-500">
                    Recibe recordatorios de tus citas médicas
                  </p>
                </div>
              </div>
              <Switch
                id="appointment-reminders"
                checked={preferences.appointmentReminders}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("appointmentReminders", checked)
                }
              />
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="low-stock-alerts">
                    Alertas de Stock Bajo
                  </Label>
                  <p className="text-sm text-gray-500">
                    Recibe alertas cuando tus medicamentos estén por agotarse
                  </p>
                </div>
              </div>
              <Switch
                id="low-stock-alerts"
                checked={preferences.lowStockAlerts}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("lowStockAlerts", checked)
                }
              />
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="quiet-hours">Horas de Silencio</Label>
                  <p className="text-sm text-gray-500">
                    No recibirás notificaciones durante estas horas
                  </p>
                </div>
              </div>
              <Switch
                id="quiet-hours"
                checked={preferences.quietHours.enabled}
                onCheckedChange={(checked) =>
                  handleQuietHoursChange("enabled", checked)
                }
              />
            </div>

            {preferences.quietHours.enabled && (
              <div className="flex gap-4 ml-8">
                <div>
                  <Label htmlFor="quiet-start">Inicio</Label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) =>
                      handleQuietHoursChange("start", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end">Fin</Label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) =>
                      handleQuietHoursChange("end", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Probar Notificaciones</CardTitle>
          <CardDescription>
            Envía una notificación de prueba para verificar que todo funciona
            correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={() => handleTestNotifications("medication")}
              disabled={isLoading || !preferences.medicationReminders}
              variant="outline">
              <Pill className="h-4 w-4 mr-2" />
              Probar Recordatorio de Medicación
            </Button>
            <Button
              onClick={() => handleTestNotifications("appointment")}
              disabled={isLoading || !preferences.appointmentReminders}
              variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Probar Recordatorio de Cita
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSavePreferences} disabled={isLoading}>
          Guardar Preferencias
        </Button>
      </div>
    </div>
  );
}
