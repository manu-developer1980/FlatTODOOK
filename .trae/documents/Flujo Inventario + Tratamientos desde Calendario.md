## Objetivo
- Separar claramente “inventario de medicamentos” (fichas sin pauta) de “episodios de tratamiento” (pauta y fechas) que se crean desde Calendario.
- Simplificar la introducción: primero se guarda la ficha del medicamento; luego se añade el tratamiento con dosis/frecuencia/rango.

## Cambios de UI/UX
### Medications (Inventario)
- Formulario reducido a ficha: `generic_name`, `brand`, `strength`, `form`, `dosage_unit`, `notes`.
- Quitar campos de pauta (`frequency`, `specific_times`, `start_date/end_date`) del alta/edición.
- Vista con lista de fichas (sin horarios ni adherencia). Acciones: “Editar”, “Eliminar”.

### Calendario
- Nuevo botón destacado “Añadir tratamiento”.
- Modal/Página paso a paso:
  1) Seleccionar medicamento del inventario (autocompletar por nombre/marca/forma/fortaleza).
  2) Definir pauta: `dosage`, `frequency` (`daily`, `twice_daily`, `every_8_hours`, `weekly`, `monthly`, `as_needed`), `times_per_day` o `specific_times[]`.
  3) Rango de fechas: `start_date`, `end_date`.
  4) Confirmar -> crea tratamiento y genera horarios.
- En tarjetas del calendario mostrar tratamientos (no fichas): estado, botón “Finalizar tratamiento” (set `end_date = hoy`, `is_active=false`).

## Servicios (App)
- `listInventory(userId)`: lista fichas (medications actuales con campos básicos).
- `createInventoryItem(userId, base)`: alta de ficha sin pauta.
- `createTreatment(userId, inventoryId, payload)`: crea un nuevo “tratamiento” reusando la ficha y añadiendo pauta/rango; genera `dosage_schedules` idempotente.
- `ensureSchedulesForDateRange(userId, start, end)`: obtiene tratamientos activos y genera horarios (ya soporta frecuencias comunes).
- `deactivateExpiredTreatments(userId)`: desactiva tratamientos cuyo `end_date` ya pasó (se invoca al cargar Calendario/Estadísticas/Medications).
- Validaciones: no permitir tomas futuras; evitar duplicados en el mismo horario; prevenir solapamientos del mismo medicamento para el mismo rango (opcional).

## Estadísticas
- Seguir usando `dosage_schedules` para adherencia diaria/periodo.
- Desgloses por tratamiento y agregación por medicamento (sumar tratamientos activos en el rango).

## Estrategia de Datos (Fases)
### Fase 1 (sin migraciones)
- Usar el patrón actual de “reutilizar ficha” duplicando la base al crear tratamiento (ya implementado parcialmente como `createMedicationTreatment`).
- Marcar como inactivo al finalizar el rango; las fichas de inventario permanecen sin pauta.

### Fase 2 (con migraciones cuando haya modo escritura)
- Introducir tablas dedicadas: `medication_catalog`, `patient_medications` y `treatments` con `dosage_schedules(treatment_id)`.
- Trigger de inactivación automática y clave única (`treatment_id`, `scheduled_time`).
- Migrar datos existentes a catálogo + tratamientos.

## Verificación
- Caso Paracetamol (Cinfa 600mg): alta en inventario; crear tratamiento desde Calendario con `every_8_hours`, rango 7 días; ver horarios y adherencia correcta; finalizar -> desaparece del calendario.
- Tests: idempotencia de generación, bloqueo de tomas futuras, no duplicación, desactivación segura.

## Entregables
- Actualizaciones de componentes (form Inventario, modal de tratamiento en Calendario).
- Servicios para inventario/tratamientos y llamadas en páginas.
- Guía breve de uso (opcional) y, en Fase 2, SQL de migración.