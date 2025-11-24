import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  Settings,
  Pill,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { NotificationService } from "@/services/notificationService";
import { Link } from "react-router-dom";
import { hasUserId } from "@/lib/userUtils";

interface NotificationQuickSettingsProps {
  className?: string;
}

export function NotificationQuickSettings({
  className,
}: NotificationQuickSettingsProps) {
  const { user } = useAuthStore();
  const [isTesting, setIsTesting] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isPushSupported, setIsPushSupported] = useState(false);

  useEffect(() => {
    // Check browser support and current permission
    const supported = NotificationService.isPushNotificationSupported();
    setIsPushSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const enableNotifications = async () => {
    try {
      const newPermission =
        await NotificationService.requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission === "granted") {
        alert("¡Notificaciones habilitadas!");
      } else {
        alert("Permisos de notificación denegados");
      }
    } catch (error) {
      alert("Error al habilitar notificaciones");
    }
  };

  const testNotification = async (type: "email" | "push" | "browser") => {
    if (!hasUserId(user)) {
      alert("Debes iniciar sesión");
      return;
    }

    setIsTesting(true);
    try {
      let result: any = {};

      switch (type) {
        case "email":
          result = await NotificationService.sendMedicationReminder(
            "Aspirina",
            "100mg",
            "08:00 AM"
          );
          if (result.emailSuccess) {
            alert("Email de prueba enviado");
          } else {
            alert("Error al enviar email");
          }
          break;

        case "push":
          result = await NotificationService.sendMedicationReminder(
            "Aspirina",
            "100mg",
            "08:00 AM"
          );
          if (result.pushSuccess) {
            alert("Notificación push enviada");
          } else {
            alert("Error al enviar notificación push");
          }
          break;

        case "browser":
          await NotificationService.showBrowserNotification(
            "Prueba de Notificación 🔔",
            {
              body: "Tu sistema de notificaciones está funcionando correctamente",
              icon: "/icon-192x192.png",
              badge: "/badge-72x72.png",
            }
          );
          alert("Notificación del navegador enviada");
          break;
      }
    } catch (error) {
      alert("Error en la prueba");
    } finally {
      setIsTesting(false);
    }
  };

  // Simple card component without external dependencies
  const Card = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`bg-white rounded-lg border shadow-sm ${className || ""}`}>
      {children}
    </div>
  );

  const CardHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-between p-4 pb-2">{children}</div>
  );

  const CardContent = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={`p-4 pt-0 ${className || ""}`}>{children}</div>;

  const CardTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg font-semibold flex items-center gap-2">
      {children}
    </h3>
  );

  const CardDescription = ({ children }: { children: React.ReactNode }) => (
    <p className="text-sm text-gray-600 mt-1">{children}</p>
  );

  const Button = ({
    children,
    onClick,
    disabled,
    variant = "primary",
    size = "md",
    className = "",
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: "primary" | "outline" | "ghost";
    size?: "sm" | "md";
    className?: string;
  }) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      outline:
        "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-500",
    };

    const sizeClasses = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2",
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
        {children}
      </button>
    );
  };

  const Badge = ({
    children,
    variant = "default",
    className = "",
  }: {
    children: React.ReactNode;
    variant?: "default" | "success" | "destructive" | "secondary";
    className?: string;
  }) => {
    const baseClasses =
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";

    const variantClasses = {
      default: "bg-blue-100 text-blue-800",
      success: "bg-green-100 text-green-800",
      destructive: "bg-red-100 text-red-800",
      secondary: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
        {children}
      </span>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <Bell className="h-5 w-5 text-blue-600" />
            Notificaciones
          </CardTitle>
          <Link to="/settings/notifications">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <CardDescription>Gestiona tus recordatorios y alertas</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Mail
                className={`h-5 w-5 ${
                  user?.email ? "text-green-500" : "text-gray-400"
                }`}
              />
            </div>
            <div className="text-xs text-gray-600">Email</div>
            <Badge
              variant={user?.email ? "success" : "secondary"}
              className="text-xs mt-1">
              {user?.email ? "Configurado" : "Pendiente"}
            </Badge>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Smartphone
                className={`h-5 w-5 ${
                  permission === "granted"
                    ? "text-green-500"
                    : permission === "denied"
                    ? "text-red-500"
                    : "text-yellow-500"
                }`}
              />
            </div>
            <div className="text-xs text-gray-600">Push</div>
            <Badge
              variant={
                permission === "granted"
                  ? "success"
                  : permission === "denied"
                  ? "destructive"
                  : "secondary"
              }
              className="text-xs mt-1">
              {permission === "granted"
                ? "Activo"
                : permission === "denied"
                ? "Bloqueado"
                : "Pendiente"}
            </Badge>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Bell
                className={`h-5 w-5 ${
                  isPushSupported ? "text-blue-500" : "text-gray-400"
                }`}
              />
            </div>
            <div className="text-xs text-gray-600">Navegador</div>
            <Badge
              variant={isPushSupported ? "default" : "secondary"}
              className="text-xs mt-1">
              {isPushSupported ? "Soportado" : "No soportado"}
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          {permission !== "granted" && (
            <Button onClick={enableNotifications} className="w-full" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Habilitar Notificaciones
            </Button>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => testNotification("email")}
              disabled={isTesting || !user?.email}
              variant="outline"
              size="sm"
              className="text-xs">
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Button>

            <Button
              onClick={() => testNotification("push")}
              disabled={isTesting || permission !== "granted"}
              variant="outline"
              size="sm"
              className="text-xs">
              <Smartphone className="h-3 w-3 mr-1" />
              Push
            </Button>

            <Button
              onClick={() => testNotification("browser")}
              disabled={isTesting || permission !== "granted"}
              variant="outline"
              size="sm"
              className="text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Navegador
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Pill className="h-3 w-3 text-gray-500" />
              Recordatorios de medicación
            </span>
            <CheckCircle className="h-3 w-3 text-green-500" />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-500" />
              Recordatorios de citas
            </span>
            <CheckCircle className="h-3 w-3 text-green-500" />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-gray-500" />
              Alertas de stock bajo
            </span>
            <CheckCircle className="h-3 w-3 text-green-500" />
          </div>
        </div>

        {/* Settings Link */}
        <Link to="/settings/notifications" className="block">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Configuración Avanzada →
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
