# MediTrack - Gestión de Medicaciones

Aplicación web para gestionar recordatorios de medicación, cuidadores y suscripciones premium.

## 🚀 Tecnologías

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Base de datos**: Supabase (PostgreSQL)
- **Pagos**: Stripe
- **Estado**: Zustand
- **Notificaciones**: Service Workers + Push API

## 📋 Características

### Plan Gratuito
- ✅ Hasta 5 medicaciones activas
- ✅ 2 cuidadores en tu red
- ✅ Recordatorios básicos
- ✅ Estadísticas semanales

### Plan Premium (5€/mes)
- ✅ Medicaciones ilimitadas
- ✅ Cuidadores ilimitados
- ✅ Recordatorios avanzados
- ✅ Estadísticas completas
- ✅ Exportación de informes

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repo>
   cd meditrack
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env` en la raíz con:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key

   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key
   VITE_API_URL=http://localhost:3001

   # Application Configuration
   VITE_APP_NAME=MediTrack
   VITE_APP_URL=http://localhost:5173
   VITE_SUPPORT_EMAIL=support@meditrack.app
   ```

   Crea un archivo `api/.env` con:
   ```env
   SUPABASE_URL=tu_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
   STRIPE_SECRET_KEY=tu_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=tu_webhook_secret
   VITE_APP_URL=http://localhost:5173
   PORT=3001
   ```

4. **Configurar Supabase**
   - Crea un proyecto en [Supabase](https://supabase.com)
   - Ejecuta las migraciones en `supabase/migrations/`
   - Configura la autenticación con email/password

5. **Configurar Stripe**
   - Crea productos para "Free" y "Premium" planes
   - Configura webhook endpoint: `http://localhost:3001/api/subscriptions/webhook`
   - Obtén el webhook signing secret

## 🚀 Desarrollo

### Frontend
```bash
npm run dev
```

### Backend
```bash
npm run dev:api
```

### Ambos simultáneamente
```bash
npm run dev:full
```

### Configurar Webhook (desarrollo)
```bash
stripe login
stripe listen --forward-to localhost:3001/api/subscriptions/webhook
```

## 📁 Estructura del Proyecto

```
├── src/                    # Frontend React
│   ├── components/         # Componentes React
│   ├── pages/             # Páginas principales
│   ├── stores/            # Estado con Zustand
│   ├── services/          # Servicios de API
│   └── lib/               # Utilidades y configuración
├── api/                    # Backend Express
│   ├── routes/            # Rutas de API
│   └── server.ts          # Servidor principal
├── supabase/              # Configuración Supabase
│   └── migrations/        # Migraciones de BD
└── public/                # Assets estáticos
```

## 🔧 API Endpoints

### Suscripciones
- `GET /api/subscriptions` - Obtener suscripción actual
- `POST /api/subscriptions/create-checkout-session` - Crear sesión de pago
- `POST /api/subscriptions/cancel-subscription` - Cancelar premium
- `POST /api/subscriptions/webhook` - Webhook de Stripe

## 🧪 Testing

### Probar suscripción premium:
1. Inicia sesión con un usuario
2. Ve a Configuración > Suscripción
3. Haz clic en "Actualizar a Premium"
4. Completa el proceso de pago con Stripe
5. Verifica que el plan se actualice

### Probar cancelación:
1. Con una suscripción premium activa
2. Haz clic en "Cancelar suscripción"
3. Confirma la cancelación
4. Verifica que el plan cambie al final del período

## 📝 Notas

- Las variables de entorno con prefijo `VITE_` están disponibles en el frontend
- El webhook secret se obtiene con `stripe listen` o desde el Dashboard
- Para producción, usa HTTPS y configura dominios reales

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.