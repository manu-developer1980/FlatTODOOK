## Objetivo
- Permitir reutilizar un medicamento en nuevos tratamientos sin volver a introducir su ficha.
- Separar la ficha del medicamento (catálogo) de los episodios de tratamiento (fechas y pauta).
- Marcar automáticamente los tratamientos como inactivos al finalizar su rango.

## Cambios de Base de Datos
- Nueva tabla `medication_catalog` (global por proyecto):
  - Campos: `id`, `generic_name`, `brand`, `strength`, `form`, `dosage_unit`, `notes`, `created_at`.
  - Índices: único por (`generic_name`, `strength`, `form`).
- Nueva tabla `patient_medications` (catálogo personal del paciente):
  - Campos: `id`, `patient_id` FK, `catalog_id` FK, `alias` opcional, `created_at`.
  - Índices: único por (`patient_id`, `catalog_id`).
- Nueva tabla `treatments` (episodios de tratamiento):
  - Campos: `id`, `patient_medication_id` FK, `frequency`, `times_per_day`, `specific_times[]`, `dosage`, `start_date`, `end_date`, `is_active`, `status` ('planned'|'active'|'finished'), `created_at`.
  - Índices: por `patient_medication_id`, `is_active`.
- `dosage_schedules` pasa a referenciar `treatment_id` (añadir columna y migrar desde `medication_id`).
- Triggers/Policies:
  - Trigger: al insertar/actualizar `treatments`, si `end_date < now()` => `is_active=false`, `status='finished'`.
  - Upsert único en `dosage_schedules` por (`treatment_id`, `scheduled_time`).
  - RLS: limitar acceso por `patient_id` derivado desde `patient_medication_id`.

## Generación de Horarios
- Servicio `ensureSchedulesForDateRange(userId, start, end)`:
  - Obtiene tratamientos activos del paciente.
  - Para cada tratamiento, genera horarios según `specific_times` o plantilla por `frequency` (`daily`, `twice_daily`, `every_8_hours`, etc.).
  - Inserta con `upsert` usando (`treatment_id`, `scheduled_time`).

## Inactivación Automática
- Trigger en BD (fiable) que marca `is_active=false` y `status='finished'` cuando `end_date` pasa.
- Refuerzo en app: al cargar tratamientos, filtrar por ventana `start_date/end_date` y actualizar `is_active` si corresponde.

## Cambios en UI/UX
- Formulario de Medicamento:
  - Paso 1: Buscar/seleccionar en catálogo (autocompletar por `generic_name`, `brand`, `strength`, `form`).
  - Paso 2: Configurar tratamiento: `frequency`, `times_per_day/specific_times`, `dosage`, `start_date`, `end_date`.
  - Acciones: "Finalizar tratamiento" (pone `end_date=now`, `is_active=false`).
- Página de Medicamentos:
  - Secciones: "Tratamientos activos", "Tratamientos finalizados", "Mi catálogo".
  - Acción "Reutilizar" para crear un nuevo tratamiento desde una ficha ya existente.

## Migración de Datos Existentes
- Crear entradas en `medication_catalog` a partir de `medications` actuales (deduplicar por `generic_name+strength+form`).
- Crear `patient_medications` asociando cada `medication` al catálogo y al `patient_id`.
- Crear `treatments` a partir de cada `medication` (copiando `frequency`, `specific_times`, `start_date`, `end_date`, `dosage`).
- Actualizar `dosage_schedules` para usar `treatment_id` con mapeo consistente.

## Estadísticas y Adherencia
- Calcular adherencia por tratamiento: `taken / total_schedules` en periodo.
- Agregar métricas por medicamento (agregación de tratamientos relativos a una misma ficha de catálogo).

## Verificación
- Flujos: crear ficha de catálogo, reutilizar en nuevo tratamiento, finalizar y ver que el calendario ya no permite tomas futuras.
- Tests: idempotencia de generación de horarios, deduplicación por (`treatment_id`, `scheduled_time`), triggers de finalización.

## Entregables
- SQL de migraciones (tablas, índices, triggers).
- Actualizaciones de servicios (creación de catálogo/patient_medication, creación de `treatments`, generación de horarios).
- Cambios de UI (formulario y vistas).