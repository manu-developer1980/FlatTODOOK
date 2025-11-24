import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Mail,
  Smartphone,
  TestTube,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { NotificationService } from "@/services/notificationService";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { hasUserId } from "@/lib/userUtils";

export function NotificationTestPanel() {
  const { user } = useAuthStore();
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    email?: boolean;
    push?: boolean;
    browser?: boolean;
    permission?: NotificationPermission;
    error?: string;
  }>({});

  const testBrowserNotifications = async () => {
    try {
      const permission =
        await NotificationService.requestNotificationPermission();
      setTestResults((prev) => ({ ...prev, permission }));

      if (permission === "granted") {
        await NotificationService.showBrowserNotification(
          "¡Prueba Exitosa! 🎉",
          {
            body: "Las notificaciones del navegador están funcionando correctamente",
            icon: "/icon-192x192.png",
            badge: "/badge-72x72.png",
            // vibrate: [200, 100, 200], // Remove vibrate as it's not supported in all browsers
          }
        );
        setTestResults((prev) => ({ ...prev, browser: true }));
        toast.success("Notificación del navegador enviada");
      } else {
        setTestResults((prev) => ({ ...prev, browser: false }));
        toast.error("Permisos de notificación denegados");
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        browser: false,
        error: error.message,
      }));
      toast.error("Error al probar notificaciones del navegador");
    }
  };

  const testEmailNotification = async () => {
    if (!hasUserId(user)) {
      toast.error("Debes iniciar sesión para probar notificaciones por email");
      return;
    }

    setIsTesting(true);
    try {
      const response = await apiRequest("/notifications/email/test", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          type: "medication",
        }),
      });

      setTestResults((prev) => ({ ...prev, email: response.success }));

      if (response.success) {
        toast.success("Email de prueba enviado exitosamente");
      } else {
        toast.error("Error al enviar email de prueba");
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        email: false,
        error: error.message,
      }));
      toast.error("Error al probar notificaciones por email");
    } finally {
      setIsTesting(false);
    }
  };

  const testPushNotification = async () => {
    if (!hasUserId(user)) {
      toast.error("Debes iniciar sesión para probar notificaciones push");
      return;
    }

    // First check if we have permission and subscription
    if (!("Notification" in window) || Notification.permission !== "granted") {
      toast.error("Los permisos de notificación no están concedidos");
      return;
    }

    setIsTesting(true);
    try {
      const response = await apiRequest("/notifications/push/test", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          type: "medication",
        }),
      });

      setTestResults((prev) => ({ ...prev, push: response.success }));

      if (response.success) {
        toast.success("Notificación push enviada exitosamente");
      } else {
        toast.error("Error al enviar notificación push");
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        push: false,
        error: error.message,
      }));
      toast.error("Error al probar notificaciones push");
    } finally {
      setIsTesting(false);
    }
  };

  const testAllNotifications = async () => {
    if (!hasUserId(user)) {
      toast.error("Debes iniciar sesión para probar notificaciones");
      return;
    }

    setIsTesting(true);
    try {
      // Test browser notification first
      await testBrowserNotifications();

      // Test email notification
      await testEmailNotification();

      // Test push notification
      await testPushNotification();

      toast.success("Todas las pruebas de notificación completadas");
    } catch (error) {
      toast.error("Error durante las pruebas de notificación");
    } finally {
      setIsTesting(false);
    }
  };

  const checkNotificationSupport = () => {
    const supported = NotificationService.isPushNotificationSupported();
    const permission = Notification.permission;

    setTestResults((prev) => ({
      ...prev,
      permission,
      browser: supported,
    }));

    return { supported, permission };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Panel de Pruebas de Notificaciones
          </CardTitle>
          <CardDescription>
            Prueba cada tipo de notificación para asegurarte de que todo
            funciona correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Email</span>
              </div>
              <div className="flex items-center gap-2">
                {testResults.email === true && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {testResults.email === false && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {testResults.email === true
                    ? "Funcionando"
                    : testResults.email === false
                    ? "Error"
                    : "No probado"}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Push</span>
              </div>
              <div className="flex items-center gap-2">
                {testResults.push === true && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {testResults.push === false && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {testResults.push === true
                    ? "Funcionando"
                    : testResults.push === false
                    ? "Error"
                    : "No probado"}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Navegador</span>
              </div>
              <div className="flex items-center gap-2">
                {testResults.permission === "granted" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {testResults.permission === "denied" && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                {testResults.permission === "default" && (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm text-gray-600 capitalize">
                  {testResults.permission || "Desconocido"}
                </span>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={testBrowserNotifications}
                variant="outline"
                className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Probar Navegador
              </Button>

              <Button
                onClick={testEmailNotification}
                disabled={isTesting}
                variant="outline"
                className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Probar Email
              </Button>

              <Button
                onClick={testPushNotification}
                disabled={isTesting}
                variant="outline"
                className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Probar Push
              </Button>
            </div>

            <Button
              onClick={testAllNotifications}
              disabled={isTesting}
              className="w-full flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              {isTesting ? "Probando..." : "Probar Todo"}
            </Button>
          </div>

          {/* Support Check */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Soporte del Sistema</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Notificaciones Push:</span>
                <span
                  className={
                    NotificationService.isPushNotificationSupported()
                      ? "text-green-600"
                      : "text-red-600"
                  }>
                  {NotificationService.isPushNotificationSupported()
                    ? "Soportado"
                    : "No soportado"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Worker:</span>
                <span
                  className={
                    "serviceWorker" in navigator
                      ? "text-green-600"
                      : "text-red-600"
                  }>
                  {"serviceWorker" in navigator
                    ? "Disponible"
                    : "No disponible"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>HTTPS/Localhost:</span>
                <span
                  className={
                    window.location.protocol === "https:" ||
                    window.location.hostname === "localhost"
                      ? "text-green-600"
                      : "text-red-600"
                  }>
                  {window.location.protocol === "https:" ||
                  window.location.hostname === "localhost"
                    ? "OK"
                    : "Requiere HTTPS"}
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {testResults.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">
                  Error: {testResults.error}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
