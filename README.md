# ClimaTech - Sistema de Gestión de Mantenimiento de Climatización

**ClimaTech** es una aplicación web completa para gestionar el mantenimiento de sistemas de climatización (aire acondicionado). Sistema empresarial desarrollado para la certificación ADSO SENA con funcionalidades de órdenes de trabajo, cotizaciones, auditoría y reportes.

## 📋 Características Principales

### ✅ Gestión de Órdenes de Trabajo
- Crear, asignar y dar seguimiento a órdenes de mantenimiento
- Estados dinámicos: pendiente → asignada → en_progreso → pending_verification → completada
- Sistema de prioridades: baja, media, alta, urgente
- Asignación automática a técnicos disponibles

### ✅ Cotizaciones Profesionales
- Generación de cotizaciones con detalles de servicios y repuestos
- Itemización completa con precios unitarios y totales
- Cálculo automático de IVA (19%)
- **Exportación a PDF** con jsPDF (diseño profesional)
- Aprobación/rechazo por cliente

### ✅ Registro de Mantenimientos
- Documentación de trabajos realizados (preventivo/correctivo)
- **Subida de imágenes** de evidencia (Supabase Storage)
- Galería de fotos por mantenimiento
- Registro de repuestos utilizados

### ✅ Gestión de Inventario
- Base de datos de repuestos con stock en tiempo real
- Asignación de repuestos a mantenimientos
- Control de disponibilidad

### ✅ Dashboards Personalizados por Rol

**Admin:**
- Estadísticas generales del sistema
- Gráficas de órdenes (pie chart, bar charts)
- Chart de ingresos por mes
- Ranking de técnicos más productivos
- Órdenes recientes

**Técnico:**
- Panel de órdenes asignadas
- Contador de órdenes activas y completadas
- Especialidad asignada
- Acceso directo a detalles de órdenes

**Cliente:**
- Seguimiento de servicios contratados
- Historial de órdenes
- Botón para solicitar nuevos servicios
- Estado actual de trabajos

### ✅ Sistema de Auditoría
- Registro de todos los cambios en las órdenes
- Antes/después de modificaciones
- Timestamps y usuario responsable
- Tabla `audit_logs` con JSONB changesets

### ✅ Notificaciones por Email
- Integración con **Resend** para envío de emails
- 9 templates HTML profesionales
- Filtrado automático de emails en testing
- Notificaciones para eventos clave

### ✅ Autenticación y Autorización
- Login con email y contraseña (bcryptjs)
- 3 roles: admin, técnico, cliente
- Control de acceso basado en rol
- Gestión de contraseñas con cambio seguro
- Contraseñas auto-generadas para nuevos usuarios

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js** 16.2.3 - Framework React con SSR
- **React** 19.2.4 - Librería UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos utilities
- **Shadcn UI** - Componentes accesibles
- **Lucide Icons** - Iconografía
- **Recharts** 2.15.0 - Gráficos interactivos
- **jsPDF** 4.2.1 - Generación de PDFs

### Backend
- **Next.js API Routes** - Backend serverless
- **Supabase** - PostgreSQL + Storage + Auth
- **PostgreSQL** - Base de datos relacional

### Seguridad
- **bcryptjs** - Hash de contraseñas
- **JWT** - Tokens de sesión
- **Supabase RLS** - Row Level Security

### Email
- **Resend** 6.10.0 - Servicio de email profesional

## 📦 Instalación y Setup

### Requisitos Previos
- Node.js 18+
- pnpm (recomendado)
- Cuenta Supabase
- Cuenta Resend

### Pasos de Instalación

1. **Instalar dependencias**
```bash
pnpm install
```

2. **Configurar `.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxx
```

3. **Crear tablas en Supabase Dashboard**
- `usuarios` - Usuarios del sistema
- `clientes` - Empresas clientes
- `tecnicos` - Personal técnico
- `equipos` - Equipos de climatización
- `ordenes_trabajo` - Órdenes de mantenimiento
- `mantenimientos` - Registros de trabajos realizados
- `mantenimiento_repuestos` - Relación mantenimiento-repuestos
- `repuestos` - Inventario de piezas
- `cotizaciones` - Solicitudes de cotización
- `cotizacion_items` - Items de cotizaciones
- `cotizacion_evidencia` - Evidencia/archivos de cotizaciones
- `mantenimiento_evidencia` - Fotos de mantenimientos
- `audit_logs` - Registro de auditoría

4. **Crear buckets en Supabase Storage**
- `cotizaciones` - Para archivos de cotizaciones
- `mantenimientos` - Para imágenes de mantenimientos

5. **Ejecutar servidor de desarrollo**
```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
climatech/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboards por rol (admin, técnico, cliente)
│   │   ├── ordenes/
│   │   │   ├── page.tsx          # Listado de órdenes
│   │   │   ├── nueva/page.tsx    # Crear nueva orden (cliente)
│   │   │   └── [id]/page.tsx     # Detalles y trabajos de mantenimiento
│   │   ├── cotizaciones-admin/
│   │   │   └── page.tsx          # Gestión de cotizaciones (admin)
│   │   ├── usuarios/page.tsx     # Gestión de usuarios (admin)
│   │   ├── equipos/page.tsx      # Gestión de equipos
│   │   ├── repuestos/page.tsx    # Inventario de repuestos
│   │   ├── tipos-trabajo/page.tsx # Tipos de mantenimiento
│   │   └── layout.tsx            # Layout dashboard con nav + configuración
│   ├── auth/
│   │   ├── callback/route.ts     # OAuth callback
│   │   └── login/page.tsx        # Página de login
│   ├── api/
│   │   ├── send-notification-email/ # Envío de notificaciones
│   │   ├── evidencia-upload/     # Upload de cotizaciones
│   │   └── imagen-mantenimiento-upload/ # Upload de imágenes
│   ├── layout.tsx                # Layout raíz
│   ├── page.tsx                  # Home
│   └── global-error.tsx          # Error boundary
├── components/
│   ├── ThemeProvider.tsx         # Proveedor de tema dark/light
│   └── ui/                       # Componentes Shadcn (40+ componentes)
├── hooks/
│   ├── use-toast.ts             # Toast notifications
│   └── use-mobile.ts            # Detección mobile
├── lib/
│   ├── api.ts                   # Funciones API centralizadas (100+ funciones)
│   ├── auth-context.ts          # Contexto de autenticación
│   ├── types.ts                 # TypeScript interfaces
│   ├── utils.ts                 # Utilidades generales
│   ├── data.ts                  # Datos de ejemplo
│   └── supabas/
│       ├── client.ts            # Cliente Supabase público
│       ├── server.ts            # Cliente Supabase servidor
│       └── middleware.ts        # Middleware auth
├── public/                      # Archivos estáticos
├── .env.local                   # Variables de entorno
├── next.config.ts               # Configuración Next.js
├── tailwind.config.ts           # Configuración Tailwind
├── tsconfig.json                # Configuración TypeScript
└── package.json                 # Dependencias del proyecto
```

## 🚀 Guía de Uso

### Como Admin
1. Crear usuarios (técnicos y clientes)
2. Gestionar equipos y tipos de trabajo
3. Ver dashboards con estadísticas
4. Completar cotizaciones solicitadas
5. Monitorear órdenes en tiempo real

### Como Técnico
1. Ver órdenes asignadas en el dashboard
2. Hacer clic en "Ver detalles" para acceder a la orden
3. Registrar trabajos de mantenimiento
4. Subir fotos de evidencia
5. Agregar repuestos utilizados
6. Marcar trabajo como completado

### Como Cliente
1. Solicitar nuevos servicios (crear orden)
2. Ver estado de órdenes en dashboard
3. Recibir cotizaciones
4. Aprobar o rechazar cotizaciones
5. Consultar historial de servicios

## 📊 Funciones API Principales

### Órdenes
- `getOrdenes()` - Obtener todas las órdenes
- `getOrdenById(id)` - Detalles de una orden
- `createOrden(data)` - Crear nueva orden
- `updateOrden(id, data)` - Actualizar estado/asignación
- `getOrdenesByClienteId(id)` - Órdenes de un cliente
- `getOrdenesByTecnicoId(id)` - Órdenes de un técnico

### Cotizaciones
- `createCotizacion(data)` - Crear cotización
- `getCotizacionesByEstado(estado)` - Filtrar por estado
- `completarCotizacion(id, data)` - Admin completa detalles
- `actualizarEstadoCotizacion(id, estado)` - Aprobar/rechazar
- `exportarCotizacionPDF(id)` - Descargar PDF

### Mantenimientos
- `createMantenimiento(data)` - Registrar trabajo
- `getMantenimientosByOrdenId(id)` - Trabajos de una orden
- `subirImagenMantenimiento(id, file)` - Subir foto
- `getImagenesMantenimiento(id)` - Obtener fotos

### Dashboard
- `getDashboardStats()` - Estadísticas generales
- `getOrdenesPorMes()` - Ingresos por mes (últimos 6 meses)
- `getTecnicosProductividad()` - Ranking técnicos

### Usuarios
- `createUsuario(data)` - Crear usuario con contraseña auto-generada
- `updateNombreUsuario(id, nombre)` - Cambiar nombre
- `updatePasswordUsuario(id, password)` - Cambiar contraseña
- `deleteUsuario(id)` - Eliminar usuario

### Auditoría
- `registrarEvento(evento, tabla, id, usuarioId, before, after, descripcion, emails)` - Registrar cambio
- Email automático a destinatarios

## 📈 Estadísticas y Reportes

### Dashboard Visualizaciones
- **Pie Chart**: Distribución de órdenes por estado
- **Bar Chart**: Preventivos vs Correctivos
- **Line Chart**: Ingresos por mes
- **Bar Chart Horizontal**: Técnicos más productivos

### Números Clave en Dashboard
- Total órdenes
- Órdenes pendientes
- Total clientes y técnicos
- Ingresos del mes

## 🔒 Seguridad

- Contraseñas hasheadas con bcryptjs (salt rounds: 10)
- JWT para sesiones
- RBAC (Role-Based Access Control)
- RLS (Row Level Security) en Supabase
- Validación de entrada en formularios
- CORS configurado

## 🚀 Deployment

### Deploy en Vercel
```bash
pnpm build
# O directamente con Vercel CLI
vercel
```

### Configurar Variables en Vercel
1. Ir a Project Settings → Environment Variables
2. Agregar todas las variables de `.env.local`
3. Redeploy

### Post-Deploy
1. Verificar conexión Supabase
2. Probar autenticación
3. Verificar envío de emails (Resend)
4. Probar uploads (Storage)

## 🐛 Troubleshooting

**Error de conexión Supabase**
- Verificar URLs y llaves en `.env.local`
- Confirmar que Supabase está activo

**Emails no se envían**
- Verificar `RESEND_API_KEY` está configurada
- En development: emails `.local` se filtran (testing)
- Usar `onboarding@resend.dev` para testing

**Upload de archivos falla**
- Verificar buckets existen en Supabase Storage
- Confirmar permisos RLS en Storage
- Tamaño máximo de archivo: revisar política Supabase

**Imágenes no cargan**
- Verificar URL pública de Storage está correcta
- Confirmar archivos están en bucket correcto

## 📝 Notas Importantes

- Las contraseñas de nuevos usuarios se generan automáticamente (12 caracteres: mayús, minús, números, símbolos)
- Los usuarios reciben contraseña por email al ser creados
- Todos los cambios se registran en `audit_logs` para auditoría
- Las imágenes se comprimen automáticamente en Storage
- Los PDFs se generan cliente-side con jsPDF (sin servidor)

## 📞 Soporte

Para reportar bugs o solicitar features, contactar al equipo de desarrollo.

## 📄 Licencia

Proyecto ADSO SENA - Uso educativo y comercial.

---

**Última actualización:** 13 de Abril de 2026  
**Versión:** 1.0.0
