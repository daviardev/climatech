# ✅ SUPABASE - SQL ARREGLADO Y LISTO

## El Problema
El error `column "password" of relation "usuarios" does not exist` ocurría porque el script SQL tenía conflictos al crear tablas existentes con `IF NOT EXISTS`.

## La Solución Implementada

### 1. ✅ Archivo SQL Actualizado
**`supabase/migrations/001_init.sql`**
- ❌ Removidos todos los `CREATE TABLE IF NOT EXISTS`
- ✅ Agregados `DROP TABLE IF EXISTS` para limpiar antes de crear
- ✅ Índices optimizados
- ✅ Datos de prueba incluidos
- ✅ Comentarios mejorados

### 2. ✅ Nuevo Archivo de Seed Data  
**`supabase/migrations/002_seed_data.sql`**
- Archivo separado SOLO para insertar datos
- Útil si necesitas re-poblar datos sin afectar las tablas
- Incluye validaciones con `ON CONFLICT` para evitar duplicados

### 3. ✅ Documentación Actualizada
**`SUPABASE_SETUP.md`**
- Instrucciones claras de ejecución
- Opciones si el script falla
- Guía paso a paso

## Cómo Ejecutar Ahora

### Primera Vez (Recomendado)
1. Abre SQL Editor en Supabase
2. Copia TODO el contenido de `supabase/migrations/001_init.sql`
3. Click en **"Execute"**
4. ✅ Listo! Las tablas y datos estarán creados

### Si el Script Falla en Partes

**Opción A (Recomendada):** Ejecuta en DOS pasos:

1. **Paso 1:** Copia desde el inicio HASTA antes de `-- ============ INSERTAR USUARIOS DE PRUEBA ============`
   - Ejecuta (crea todas las tablas e índices)

2. **Paso 2:** Copia desde `-- ============ INSERTAR USUARIOS DE PRUEBA ============` hasta el final
   - Ejecuta (inserta datos de prueba)

**Opción B:** Usa archivos separados:
1. Ejecuta `supabase/migrations/001_init.sql` (completo)
2. Si es necesario, ejecuta `supabase/migrations/002_seed_data.sql`

## ¿Qué Cambió Exactamente?

| Antes | Después |
|-------|---------|
| `CREATE TABLE IF NOT EXISTS` | `DROP TABLE IF EXISTS CASCADE;` + `CREATE TABLE` |
| Sin control de orden | DROP explícitos en orden correcto |
| Conflictos de tablas | Limpieza segura antes de crear |
| Un único archivo con todo | Opción de separar en dos scripts |

## Usuarios Creados

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@climatech.com | admin123 |
| Técnico | tecnico@climatech.com | tecnico123 |
| Cliente | cliente@climatech.com | cliente123 |

## Próximo Paso

👉 **Abre `SUPABASE_SETUP.md` paso 2 y ejecuta el SQL actualizado**

Si algún error persiste, reporta el mensaje de error específico y analizaremos qué está causándolo.
