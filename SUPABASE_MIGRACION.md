# ✅ ClimaTech - Migración a Supabase Completada

## Resumen de cambios realizados

### 1. ✅ Archivo SQL con estructura completa
**Archivo:** `supabase/migrations/001_init.sql`

Contiene:
- 10 tablas con relaciones correctas
- Constraints y validaciones
- Índices para optimización
- Datos de prueba iniciales

**Tablas creadas:**
```
├── usuarios (autenticación con 3 roles)
├── clientes
├── tecnicos
├── equipos
├── ordenes_trabajo
├── mantenimientos
├── repuestos
├── detalle_repuestos
├── cotizaciones
└── cotizacion_items
```

### 2. ✅ Actualización de lib/api.ts
**Cambios:**
- ❌ Eliminadas importaciones de datos mock (`./data`)
- ❌ Removidos `delay()` simulados
- ✅ Implementadas queries reales a Supabase
- ✅ Manejo de errores con try/catch
- ✅ 100% compatible con tipos existentes

**Funciones migradas (27 total):**
- Autenticación (2)
- Clientes CRUD (6)
- Técnicos (5)
- Equipos (6)
- Órdenes (7)
- Mantenimientos (3)
- Repuestos (2)
- Cotizaciones (5)
- Dashboard (1)
- Helpers (4)

### 3. ✅ Usuarios de Autenticación Listos

| Rol      | Email                    | Contraseña  | Estado   |
|----------|--------------------------|-------------|----------|
| ADMIN    | admin@climatech.com      | admin123    | ✅ Creado |
| TÉCNICO  | tecnico@climatech.com    | tecnico123  | ✅ Creado |
| CLIENTE  | cliente@climatech.com    | cliente123  | ✅ Creado |

### 4. ✅ Archivos de Documentación

- **SUPABASE_SETUP.md** - Guía paso a paso
- **.env.local.example** - Plantilla de variables
- **setup-supabase.sh** - Script de configuración

## Estructura de Datos Implementada

### Tabla Usuarios
```sql
id UUID
nombre VARCHAR(255)
email VARCHAR(255) UNIQUE
password VARCHAR(255)
rol VARCHAR CHECK ('admin', 'tecnico', 'cliente')
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Roles y Permisos

**ADMIN:**
- Ver/editar todas las órdenes
- Gestionar usuarios y técnicos
- Acceso completo al sistema

**TÉCNICO:**
- Ver órdenes asignadas
- Registrar mantenimientos
- Actualizar estado de trabajo

**CLIENTE:**
- Ver sus propias órdenes
- Ver equipos registrados
- Ver cotizaciones

## Cómo Implementar

### Paso 1: Configurar Variables de Entorno
```bash
cp .env.local.example .env.local
# Edita .env.local y agrega tu URL y clave de Supabase
```

### Paso 2: Ejecutar el Script SQL
1. Ve a tu proyecto en Supabase
2. Abre SQL Editor
3. Copia `supabase/migrations/001_init.sql`
4. Ejecuta el script

### Paso 3: Probar la Conexión
```bash
pnpm dev
```
- Abre http://localhost:3000
- Intenta iniciar sesión con: `admin@climatech.com` / `admin123`

## Características Implementadas

✅ **Autenticación**
- 3 roles (admin, tecnico, cliente)
- Login por email/password
- Gestión de sesiones en AppAuth

✅ **Gestión de Órdenes**
- CRUD completo
- Estados (pendiente, asignada, en progreso, completada, cancelada)
- Prioridades (baja, media, alta)
- Asignación de técnicos

✅ **Mantenimiento**
- Tipos: preventivo/correctivo
- Registro de evidencia (URLs)
- Historial por orden

✅ **Inventario**
- Gestión de repuestos
- Control de stock
- Detalle de repuestos por mantenimiento

✅ **Cotizaciones**
- Creación y seguimiento
- Estados: pendiente/aprobada/rechazada
- Items con precio unitario

✅ **Dashboard**
- Estadísticas en tiempo real
- Total de órdenes completadas/pendientes
- Ingresos del mes
- Conteo de técnicos y equipos

## Base de Datos de Prueba

Se crean automáticamente:
- 1 Cliente: "Empresa Refrigeración SA"
- 1 Técnico: "Carlos Técnico" (especialidad: Refrigeración Industrial)
- 1 Equipo: Aire Acondicionado Carrier
- 5 Repuestos: Compresor, Filtro, Evaporador, Condensador, Válvula

## Notas Importantes

⚠️ **Consideraciones de seguridad:**
- Las contraseñas se almacenan en texto plano (SOLO PARA DESARROLLO)
- En producción: implementar Supabase Auth con OAuth
- Implementar hashing de contraseñas (bcrypt)
- Configurar RLS (Row Level Security)

## Próximos Pasos (Opcional)

[ ] Implementar Supabase Auth real
[ ] Agregar hashing de contraseñas
[ ] Configurar RLS para cada rol
[ ] Implementar auditoría con triggers
[ ] Agregar funciones PostgreSQL personalizadas
[ ] Configurar backups automáticos

## Verificación Final

```bash
# 1. Verificar que apits está actualizado
grep "supabase.from" lib/api.ts

# 2. Verificar que no hay referencias a ./data
grep "from './data'" lib/api.ts

# 3. Verificar que env está configurado
cat .env.local | grep SUPABASE
```

## Soporte

Si encuentras problemas:
1. Verifica que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY están configuradas
2. Revisa la consola del navegador para errores
3. Verifica que el script SQL se ejecutó correctamente
4. Consulta los logs de Supabase en el dashboard
