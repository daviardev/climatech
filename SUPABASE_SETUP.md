# Configuración de Supabase para ClimaTech

## Instrucciones para implementar la base de datos

### 1. Crear proyecto en Supabase

1. Ir a [https://supabase.com](https://supabase.com)
2. Crear una nueva cuenta o iniciar sesión
3. Crear un nuevo proyecto
4. Copiar **`NEXT_PUBLIC_SUPABASE_URL`** y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Guardar en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui
```

### 2. Ejecutar el SQL en Supabase

1. Ve a tu proyecto en Supabase
2. Navega a **SQL Editor** > **New Query**
3. Copia todo el contenido de `supabase/migrations/001_init.sql`
4. **Ejecuta el script completo de una vez**

**⚠️ Si obtienes error de columna no existente:**

Si el script falla con errores sobre columnas inexistentes, significa que debió ejecutarse en dos partes. Sigue estos pasos:

1. **Ejecutar PRIMERO**: Copia desde el inicio del archivo hasta justo **ANTES de** `-- ============ INSERTAR USUARIOS DE PRUEBA ============` (incluye todos los CREATE TABLE e ÍNDICES)
2. **Luego EJECUTAR**: El resto del archivo (la sección de INSERT)

O simplemente ejecuta el script completo de nuevo y debería funcionar correctamente ahora que está actualizado.

### 3. Usuarios de Prueba Creados

El script crea automáticamente 3 usuarios con los 3 roles:

#### **ADMIN**
- Email: `admin@climatech.com`
- Contraseña: `admin123`
- Rol: `admin`

#### **TÉCNICO**
- Email: `tecnico@climatech.com`
- Contraseña: `tecnico123`
- Rol: `tecnico`

#### **CLIENTE**
- Email: `cliente@climatech.com`
- Contraseña: `cliente123`
- Rol: `cliente`

### 3. Verificar la Conexión

1. Inicia la aplicación: `pnpm dev`
2. Intenta iniciar sesión con uno de los usuarios anteriores
3. Verifica en la consola que no hay errores de conexión

### 4. (Alternativo) Si necesitas re-ejecutar solo los datos de prueba

Si necesitas limpiar y recrear solo los datos de prueba sin afectar las tablas:

```bash
# Opción 1: Ejecutar el script de seed en Supabase
# Ve a SQL Editor y copia: supabase/migrations/002_seed_data.sql

# Opción 2: Ejecutar el script completo de nuevo
# Copia: supabase/migrations/001_init.sql
```

**Tablas creadas:**
- `usuarios` - Autenticación y roles (admin, tecnico, cliente)
- `clientes` - Información de clientes
- `tecnicos` - Información de técnicos
- `equipos` - Equipos registrados (AC, refrigeración, etc)
- `ordenes_trabajo` - Órdenes de servicio
- `mantenimientos` - Registros de mantenimiento
- `repuestos` - Inventario de repuestos
- `detalle_repuestos` - Detalles de repuestos usados
- `cotizaciones` - Cotizaciones a clientes
- `cotizacion_items` - Ítems de cotizaciones

**Índices:**
- Se crearon índices para optimizar búsquedas por usuario, cliente, técnico, estado, etc.

### 6. Datos de Prueba Incluidos

Automáticamente se crean:
- 1 Cliente: "Empresa Refrigeración SA" (vinculado al usuario cliente)
- 1 Técnico: "Carlos Técnico" con especialidad "Refrigeración Industrial"
- 1 Equipo: Aire Acondicionado Carrier (vinculado al cliente)
- 5 Repuestos: Compresor, Filtro, Evaporador, Condensador, Válvula

## Notas Importantes

- **Contraseñas**: Ahora se almacenan con hash bcryptjs (ver sección 4 abajo)
- Las relaciones de foreign key están configuradas con ON DELETE CASCADE excepto tecnico_id
- Los UUIDs se generan automáticamente con `gen_random_uuid()`
- Todos los registros tienen `created_at` y `updated_at` para auditoría

### 4. Hashear Contraseñas de Usuarios de Prueba (IMPORTANTE)

Después de ejecutar `001_init.sql` y opcionalmente `002_seed_data.sql`, debes ejecutar `003_hash_passwords.sql` para hashear las contraseñas:

1. Navega a **SQL Editor** > **New Query**
2. Copia todo el contenido de `supabase/migrations/003_hash_passwords.sql`
3. Ejecuta el script

Esto actualiza las contraseñas a versiones hasheadas con bcryptjs:

#### **ADMIN**
- Email: `admin@climatech.com`
- Contraseña (plaintext): `admin123`
- Estado: Ahora hasheada ✅

#### **TÉCNICO**
- Email: `tecnico@climatech.com`
- Contraseña (plaintext): `tecnico123`
- Estado: Ahora hasheada ✅

#### **CLIENTE**
- Email: `cliente@climatech.com`
- Contraseña (plaintext): `cliente123`
- Estado: Ahora hasheada ✅

## Gestión de Usuarios desde el Dashboard

Después de completar los pasos anteriores, puedes crear nuevos usuarios directamente desde la app:

1. **Inicia sesión como admin**: `admin@climatech.com` / `admin123`
2. **Accede a**: Dashboard > Usuarios (menú izquierdo)
3. **Clic en "Nuevo Usuario"**
4. **Completa el formulario:**
   - Nombre: Nombre completo
   - Email: Email único
   - Contraseña: Mínimo 6 caracteres (se hashea automáticamente)
   - Rol: Selecciona entre Administrador, Técnico o Cliente
5. **Clic en "Crear Usuario"**

✅ El usuario se crea con contraseña hasheada automáticamente

⚠️ **Solo administradores pueden ver y crear usuarios**

## Próximos Pasos

1. Crear nuevos usuarios desde el dashboard para clientes y técnicos
2. Los nuevos usuarios aparecerán en el dropdown al crear clientes
3. Implementar RLS (Row Level Security) para seguridad
4. Crear funciones PostgreSQL para operaciones complejas
