# Gestión de Usuarios - ClimaTech

## 📋 Descripción

La página de gestión de usuarios permite a los **administradores del sistema** crear, ver y gestionar todos los usuarios de la aplicación.

## 🔐 Seguridad

- ✅ **Protección de rol**: Solo administradores pueden acceder a esta página
- ✅ **Hashing de contraseñas**: Todas las contraseñas se guardan con bcryptjs (10 rounds)
- ✅ **Validación de email**: Solo acepta emails únicos (constraint UNIQUE en BD)
- ✅ **Password mínimo 6 caracteres**: Validación en frontend y backend

## 📍 Ubicación

```
Dashboard > Usuarios (menú izquierdo)
```

**URL**: `/dashboard/usuarios`

## 🚀 Cómo Crear un Nuevo Usuario

### Paso 1: Accede como Admin
1. Inicia sesión con: `admin@climatech.com` / `admin123`
2. Abre el **Dashboard**

### Paso 2: Ve a Usuarios
- Haz clic en **"Usuarios"** en el menú izquierdo
- Verás la lista de todos los usuarios creados

### Paso 3: Crea Nuevo Usuario
1. Haz clic en el botón **"+ Nuevo Usuario"** (arriba a la derecha)
2. Se abrirá un diálogo con el formulario
3. Completa los campos:

   **Nombre** (requerido)
   - El nombre completo del usuario
   - Ejemplo: "Ana García" o "Juan López"

   **Email** (requerido, único)
   - Dirección de email única en el sistema
   - Ejemplo: "ana.garcia@climatech.com"
   - ⚠️ Si el email ya existe, verás error: "Este email ya está registrado"

   **Contraseña** (requerido, mínimo 6 caracteres)
   - La contraseña que el usuario usará para iniciar sesión
   - Se guardará con hash bcryptjs en la BD
   - Los caracteres se ocultan mientras escribes

   **Rol** (requerido)
   - **Administrador**: Acceso total al sistema (ver usuarios, crear clientes, etc.)
   - **Técnico**: Acceso a órdenes de trabajo asignadas y mantenimiento
   - **Cliente**: Acceso limitado a sus propios datos (órdenes, equipos, cotizaciones)

### Paso 4: Guarda el Usuario
1. Haz clic en **"Crear Usuario"**
2. Verás un spinner mientras se procesa
3. El usuario se creará en la BD con contraseña hasheada
4. La página se actualizará automáticamente mostrando el nuevo usuario
5. El formulario se cerrará automáticamente

## 📊 Vista de Lista de Usuarios

La tabla muestra:

| Columna | Descripción |
|---------|-------------|
| **Usuario** | Nombre del usuario e ID único |
| **Email** | Correo electrónico del usuario |
| **Rol** | Rol del usuario (coloreado: Rojo=Admin, Azul=Técnico, Verde=Cliente) |
| **Acciones** | Menú con opciones (eliminar usuario en futuro) |

## 🔍 Búsqueda

Usa el campo de búsqueda para filtrar usuarios por:
- **Nombre**: "Ana", "Juan"
- **Email**: "ana@", "cliente@"

El filtrado es en tiempo real y case-insensitive.

## 💡 Casos de Uso

### Caso 1: Crear Cliente para vinculación
```
Paso 1: Admin crea usuario "Cliente Nueva Empresa" con rol "Cliente"
Paso 2: Vuelve a Clientes
Paso 3: Crea nuevo cliente vinculado al usuario recién creado
Paso 4: Listo, el cliente tiene acceso al sistema
```

### Caso 2: Crear Técnico
```
Paso 1: Admin crea usuario "Técnico Carlos" con rol "Técnico"
Paso 2: Carlos recibe instrucciones para iniciar sesión
Paso 3: Carlos se loguea con su email y contraseña
Paso 4: Ve sus órdenes asignadas
```

### Caso 3: Crear Administrador
```
Paso 1: Admin crea otro usuario con rol "Administrador"
Paso 2: Este nuevo admin también puede crear usuarios y gestionar todo
```

## ⚙️ Validaciones

### En el Formulario (Frontend)

| Campo | Validación | Mensaje de Error |
|-------|----------|-----------------|
| Nombre | No vacío | "El nombre es requerido" |
| Email | No vacío | "El email es requerido" |
| Email | Formato válido | "Email inválido" |
| Contraseña | Mínimo 6 caracteres | "La contraseña debe tener mínimo 6 caracteres" |
| Rol | Debe seleccionar | "Debes seleccionar un rol" |

### En la Base de Datos (Backend)

- **Email UNIQUE**: Supabase rechaza email duplicado
- **Rol CHECK**: Solo acepta `admin`, `tecnico`, `cliente`
- **Password**: Hasheado con bcryptjs antes de guardar

## 🔄 Flujo de Creación Completo

```
Admin rellena formulario
    ↓
Validación Frontend
    ↓
Click "Crear Usuario" (botón deshabilitado durante proceso)
    ↓
API `createUsuario()` ejecuta:
  1. Valida datos (email, contraseña, rol)
  2. Hashea contraseña con bcryptjs
  3. Inserta en tabla `usuarios`
    ↓
Si hay error (email duplicado, etc):
  → Muestra mensaje de error rojo en el formulario
  → Usuario permanece en el diálogo
    ↓
Si éxito:
  → Recarga lista de usuarios
  → Cierra el diálogo
  → Muestra nuevo usuario en tabla
```

## 📢 Actualizaciones en API

Nuevas funciones en `lib/api.ts`:

### `getUsuarios(): Promise<User[]>`
- Obtiene todos los usuarios ordenados por fecha de creación
- Usada para llenar la tabla en la página

### `createUsuario(nombre, email, password, rol): Promise<User>`
- Crea nuevo usuario
- **Hashea automáticamente la contraseña**
- Lanza error si email ya existe

### Login actualizado
- Ahora usa `bcrypt.compare()` para verificar contraseñas
- Funciona con contraseñas hasheadas

## 🔗 Integración con Otros Módulos

### Después de crear usuario **Cliente**
1. Ir a **Clientes**
2. Click "Nuevo Cliente"
3. El usuario creado aparecerá en el dropdown "Usuario" 🎉
4. Seleccionarlo para vincular

### Después de crear usuario **Técnico**
1. Va a aparecer en la lista de técnicos (en futuro)
2. Puede ser asignado a órdenes de trabajo

## 🚨 Errores Comunes

### "Este email ya está registrado"
```
Causa: El email ya existe en la BD
Solución: Usa un email diferente
```

### "La contraseña debe tener mínimo 6 caracteres"
```
Causa: La contraseña tiene menos de 6 caracteres
Solución: Usa una contraseña más larga
```

### "Email inválido"
```
Causa: El email no tiene formato válido (sin @)
Solución: Usa formato: usuario@dominio.com
```

## 📝 Notas

- ✅ Las contraseñas se guardan **hasheadas** (no se pueden ver ni recuperar)
- ✅ Los usuarios no pueden editarse desde aquí (de momento, solo crear y eliminar)
- ✅ No puedes eliminar el usuario admin con el que está logueado
- ✅ Todos los usuarios creados desde aquí pueden iniciar sesión inmediatamente
- ✅ El hashing de contraseña es automático y transparente

## 🔐 Seguridad en Producción

Para producción, considera:
- Implementar Supabase Auth (autenticación oficial)
- Agregar 2FA (Two-Factor Authentication)
- RLS (Row Level Security) para restricciones
- Auditoría de cambios de usuarios
- HTTPS obligatorio (debería estar hecho if hosted)
