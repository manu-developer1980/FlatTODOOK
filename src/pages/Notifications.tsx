import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { useNotificationsStore } from "@/stores/notifications";
// import { NotificationService } from '@/services/notificationService'
import type { Notification } from "@/types";
import { NotificationType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Award,
  Flame,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { hasUserId } from "@/lib/userUtils";

export default function Notifications() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    subscribeToNotifications,
  } = useNotificationsStore();

  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (hasUserId(user)) {
      loadNotifications(user.id);
      const unsubscribe = subscribeToNotifications(user.id);
      return unsubscribe;
    }
  }, [user?.id, loadNotifications, subscribeToNotifications]);

  useEffect(() => {
    // Request browser notification permission
    // NotificationService.requestNotificationPermission()
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "medication_reminder":
        return <Clock className="h-6 w-6 text-blue-600" />;
      case "appointment_reminder":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "refill_reminder":
        return <AlertTriangle className="h-6 w-6 text-orange-600" />;
      case "system_alert":
        return <Users className="h-6 w-6 text-purple-600" />;
      default:
        return <Bell className="h-6 w-6 text-gray-600" />;
    }
  };

  const getNotificationColor = (isRead: boolean) => {
    return isRead ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200";
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setIsProcessing(notificationId);
    try {
      await markAsRead(notificationId);
    } catch (error) {
      toast.error("Error al marcar notificación como leída");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsProcessing("all");
    try {
      await markAllAsRead();
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (error) {
      toast.error("Error al marcar todas como leídas");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setIsProcessing(notificationId);
    try {
      await deleteNotification(notificationId);
      toast.success("Notificación eliminada");
    } catch (error) {
      toast.error("Error al eliminar notificación");
    } finally {
      setIsProcessing(null);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error al cargar notificaciones
            </h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => hasUserId(user) && loadNotifications(user.id)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-full">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Notificaciones
                </h1>
                <p className="text-gray-600">
                  Mantente informado sobre tus medicaciones
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {unreadCount} sin leer
                </span>
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isProcessing === "all"}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Marcar todo como leído
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-600">
                {unreadCount === 0
                  ? "¡Estás al día! No tienes notificaciones pendientes."
                  : "Cuando tengas recordatorios o actualizaciones, aparecerán aquí."}
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${getNotificationColor(
                  notification.is_read
                )}`}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-gray-700 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            {
                              addSuffix: true,
                              locale: es,
                            }
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={isProcessing === notification.id}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
                            title="Marcar como leída">
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={isProcessing === notification.id}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                          title="Eliminar notificación">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {notifications.length > 0 && notifications.length % 50 === 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => hasUserId(user) && loadNotifications(user.id)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Cargar más notificaciones
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
