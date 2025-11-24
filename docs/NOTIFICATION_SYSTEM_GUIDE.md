# Sistema de Notificaciones - Guía de Uso

## 📧 Configuración de Email (Brevo)

La configuración de email ya está implementada con tu API key de Brevo:

```env
BREVO_API_KEY=xsmtpsib-e764ca591da82dc6249c90e297fb47297db179e6e8e0714cf527009815ade21e-1By3Aiir4CzZ6HmQ
EMAIL_FROM=manu.developer1980@gmail.com
```

## 🔔 Tipos de Notificaciones Disponibles

### 1. **Recordatorios de Medicación**

- **Email**: Template HTML profesional con detalles del medicamento
- **Push**: Notificación con botones de acción (Tomado ✅, Posponer ⏰)
- **Navegador**: Notificación estándar del navegador

### 2. **Recordatorios de Citas**

- **Email**: Template con información de la cita
- **Push**: Notificación con botón de ver detalles
- **Navegador**: Notificación estándar

### 3. **Alertas de Stock Bajo**

- **Push**: Notificación cuando los medicamentos están por agotarse
- **Navegador**: Alerta visual

## 🚀 Cómo Usar el Sistema

### Enviar Notificaciones desde el Frontend

```typescript
import { NotificationService } from "@/services/notificationService";

// Recordatorio de medicación
await NotificationService.sendMedicationReminder(
  "Paracetamol",
  "500mg",
  "08:00 AM"
);

// Recordatorio de cita
await NotificationService.sendAppointmentReminder(
  "Consulta Médica",
  "2024-01-15",
  "10:00 AM",
  "Dr. García"
);

// Alerta de stock bajo
await NotificationService.sendLowStockAlert("Ibuprofeno", 5);
```

### Probar el Sistema

1. **Panel de Pruebas**: Visita `/settings/notifications` para probar todas las notificaciones
2. **Test Individual**: Usa el componente `NotificationTestPanel`
3. **Verificación**: Revisa tu email y las notificaciones del navegador

## ⚙️ Endpoints del Backend

### Email Notifications

- `POST /api/notifications/email/medication-reminder`
- `POST /api/notifications/email/appointment-reminder`

### Push Notifications

- `POST /api/notifications/push/subscribe`
- `POST /api/notifications/push/unsubscribe`
- `POST /api/notifications/push/medication-reminder`
- `POST /api/notifications/push/appointment-reminder`
- `POST /api/notifications/push/low-stock-alert`

### Testing

- `POST /api/notifications/test`

## 🔧 Configuración de Web Push

Las claves VAPID ya están configuradas:

```env
VAPID_PUBLIC_KEY=BAfjMiO-hrtfSNkDtCIMZfnd7DYQ_qASzDVXqhk6XzTpngq1ELtxqWobJIFLlCmufsFYzqwTRVGMTyAulFd_8AA
VAPID_PRIVATE_KEY=gw9HV8rW6i32gPv8YOZ8F3jECqldVepHDALMUqDYVt4
VAPID_SUBJECT=mailto:support@meditrack.app
```

## 📱 Service Worker

El Service Worker (`/sw.js`) maneja:

- Recepción de notificaciones push
- Clicks en notificaciones con acciones
- Redirección a páginas específicas
- Almacenamiento en caché para funcionamiento offline

## 🎨 Personalización

### Templates de Email

Los templates están en `api/services/emailService.ts`:

- `sendMedicationReminder()`: Para recordatorios de medicación
- `sendAppointmentReminder()`: Para recordatorios de citas

### Notificaciones Push

Las configuraciones están en `api/services/pushNotificationService.ts`:

- Vibración personalizada por tipo
- Iconos y badges
- Acciones específicas

## 🔒 Seguridad

- Las suscripciones push se almacenan de forma segura
- Solo el usuario puede acceder a sus propias suscripciones
- Los emails se envían a través de Brevo (SMTP seguro)

## 🐛 Solución de Problemas

### Notificaciones Push No Llegan

1. Verifica que el navegador soporte push notifications
2. Asegúrate de estar en HTTPS o localhost
3. Comprueba los permisos del navegador
4. Revisa la consola del Service Worker

### Emails No Llegan

1. Verifica la API key de Brevo
2. Comprueba el email del usuario en la base de datos
3. Revisa los logs del backend
4. Verifica que el email no esté en spam

### Service Worker No Se Registra

1. Verifica que estés en HTTPS o localhost
2. Comprueba que el archivo `/sw.js` exista
3. Revisa la consola del navegador

## 📊 Monitoreo

El sistema incluye:

- Logs detallados en el backend
- Confirmación de entrega de emails
- Gestión de suscripciones expiradas
- Estadísticas de notificaciones enviadas

## 🚀 Próximos Pasos

1. **Programación de Recordatorios**: Implementar cron jobs para enviar recordatorios automáticos
2. **Estadísticas**: Añadir panel de estadísticas de notificaciones
3. **Gestión de Suscripciones**: Mejorar la gestión de suscripciones push
4. **Templates Personalizados**: Añadir más templates de email
5. **Multi-idioma**: Soporte para múltiples idiomas
