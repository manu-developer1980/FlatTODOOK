## Objetivo
Convertir todas las secciones de Configuración en funcionales y conectar pagos Stripe para el plan Premium.

## Datos Personales
- Cargar datos reales del paciente usando `db.getUser(user.user_id)` y pre-rellenar los inputs (nombre, email, fecha nacimiento, teléfono, etc.).
- Convertir los inputs a controlados y guardar cambios con `db.updateUser(user.user_id, { ... })`.
- Validar campos requeridos y mostrar feedback (toast de éxito/error).

## Notificaciones
- Crear persistencia de ajustes de notificación:
  - Tabla `user_settings` (RLS por `patient_id`) con columnas JSONB: `notifications`, `privacy`, `appearance`, `language`.
  - Alternativa si prefieres columnas: `notification_settings` con campos booleanos y horarios.
- Guardar toggles y horario inicio/fin en `notifications` (ej. `medication_reminders`, `caregiver_alerts`, `achievements`, `email_notifications`, `start_time`, `end_time`).
- Integrar con `useNotificationScheduler`: leer `user_settings.notifications` para activar/desactivar chequeos y push.

## Privacidad
- Persistir opciones: `profile_private`, `two_factor`, `share_with_doctors`, `anonymous_research` dentro de `user_settings.privacy`.
- Botón Guardar que actualiza la fila del usuario y muestra confirmación.

## Cuidadores
- Hacer funcional “Invitar Cuidador”:
  - Modal con email y relación.
  - Llamar a `db.inviteCaregiver(patientId, email, relationship)`.
- Listar cuidadores con `db.getCaregivers(patientId)`, permitir eliminar/revocar.
- Notificaciones de invitación existentes redirigen a `/settings?tab=caregivers`.

## Apariencia e Idioma
- Apariencia: guardar `font_size`, `high_contrast`, `theme_mode` en `user_settings.appearance` y aplicar en la UI (clases Tailwind condicionales y preferencia persistida).
- Idioma: usar `patients.preferred_language` ya existente y añadir selección en Settings; guardar con `db.updateUser`.
- Opcional: `timezone` y formato de fecha/hora en `user_settings.language`.

## Suscripción y Stripe
- Actual estado: `SubscriptionManager` llama a endpoints `${VITE_API_URL}/api/subscriptions/...` que no existen.
- Implementar backend con Supabase Edge Functions:
  1. `create-checkout-session`: crea sesión de Checkout con `STRIPE_SECRET_KEY`, precio `stripe_price_id`, y asocia `auth.user.id` a `subscriptions`.
  2. `cancel-subscription`: cancela en Stripe y actualiza `subscriptions` (estado y `cancel_at_period_end`).
  3. Webhook `stripe/webhook`: maneja eventos (`checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`) actualizando `subscriptions`.
- Ajustar `SubscriptionService` para llamar a las Edge Functions en vez de `VITE_API_URL` (o configurar `VITE_API_URL` al endpoint desplegado).
- Confirmar claves: `VITE_STRIPE_PUBLISHABLE_KEY` (frontend) y `STRIPE_SECRET_KEY` (server) y `PRICE_PREMIUM`.

## Seguridad y RLS
- Añadir políticas RLS para `user_settings` (SELECT/INSERT/UPDATE por el `patient_id` del usuario autenticado).
- Verificar RLS existente en `subscriptions` (migración ya creada) y que las funciones de servicio usen `service_role` cuando proceda (Edge Functions).

## UX y Verificación
- Mostrar estados de carga/guardado y deshabilitar botones mientras se procesa.
- Tests manuales:
  - Editar datos personales y verificar persistencia/recarga.
  - Cambiar toggles de notificación y comprobar que el scheduler respeta ajustes.
  - Invitar cuidador y ver la lista actualizada.
  - Cambiar idioma/apariencia y ver efecto inmediato.
  - Flujo premium: iniciar Checkout, completar, ver suscripción activa; probar cancelación.

## Entregables
- Migración SQL para `user_settings`.
- Edge Functions `create-checkout-session`, `cancel-subscription`, `webhook`.
- Actualizaciones en `Settings.tsx`, `SubscriptionManager.tsx`, `subscriptionService.ts`, `useNotificationScheduler.ts`.

¿Confirmas que avanzamos con este plan?