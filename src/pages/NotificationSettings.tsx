import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { Button } from "@/components/ui/button";
import { Bell, Settings, History } from "lucide-react";
import { NotificationService } from "@/services/notificationService";
import { toast } from "sonner";

export function NotificationSettingsPage() {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestAll = async () => {
    setIsTesting(true);
    try {
      const result = await NotificationService.testNotificationSystem(
        "medication"
      );

      if (result.permission === "denied") {
        toast.error("Los permisos de notificación están denegados");
      } else if (result.permission === "default") {
        toast.info("Por favor, otorga permisos de notificación primero");
      } else {
        const messages = [];
        if (result.emailSuccess) messages.push("Email");
        if (result.pushSuccess) messages.push("Push");

        if (messages.length > 0) {
          toast.success(
            `Sistema de notificaciones funcionando: ${messages.join(" y ")}`
          );
        } else {
          toast.error("No se pudieron enviar las notificaciones");
        }
      }
    } catch (error) {
      toast.error("Error al probar el sistema de notificaciones");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Configuración de Notificaciones
        </h1>
        <p className="text-muted-foreground">
          Personaliza cómo y cuándo recibes recordatorios sobre tus medicamentos
          y citas
        </p>
      </div>

      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferencias
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Prueba
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4">
          <NotificationPreferences />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Notificaciones</CardTitle>
              <CardDescription>
                Revisa las notificaciones que has recibido recientemente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  El historial de notificaciones aparecerá aquí
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Las notificaciones recientes se mostrarán en esta sección
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Probar Sistema de Notificaciones</CardTitle>
              <CardDescription>
                Verifica que tu sistema de notificaciones esté funcionando
                correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">
                    ¿Qué se probará?
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Permisos de notificación del navegador</li>
                    <li>• Configuración de notificaciones push</li>
                    <li>• Servicio de email (Brevo)</li>
                    <li>• Integración con el backend</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleTestAll}
                    disabled={isTesting}
                    className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    {isTesting ? "Probando..." : "Probar Sistema Completo"}
                  </Button>
                </div>

                <div className="text-sm text-gray-500">
                  <p>
                    Nota: Asegúrate de tener los permisos de notificación
                    habilitados en tu navegador.
                  </p>
                  <p className="mt-1">
                    Las notificaciones de prueba se enviarán a tu email
                    registrado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
