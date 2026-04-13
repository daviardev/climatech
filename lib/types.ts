// Tipos de datos basados en el modelo de base de datos del proyecto

export type UserRole = 'admin' | 'tecnico' | 'cliente'

export interface User {
  id: string
  nombre: string
  email: string
  password: string
  rol: UserRole
}

export interface Cliente {
  id: string
  nombre: string
  telefono: string
  direccion: string
  usuario_id: string
}

export interface Tecnico {
  id: string
  nombre: string
  especialidad: string
  usuario_id: string
  disponible: boolean
}

export interface Equipo {
  id: string
  tipo: string
  marca: string
  modelo: string
  cliente_id: string
  numero_serie?: string
  fecha_instalacion?: string
}

export type EstadoOrden = 'pendiente' | 'asignada' | 'en_progreso' | 'pending_verification' | 'completada' | 'cancelada'

export interface OrdenTrabajo {
  id: string
  fecha: string
  estado: EstadoOrden
  cliente_id: string
  tecnico_id: string | null
  equipo_id: string
  descripcion: string
  prioridad: 'baja' | 'media' | 'alta'
}

export type TipoMantenimiento = 'preventivo' | 'correctivo'

export interface Mantenimiento {
  id: string
  tipo: TipoMantenimiento
  descripcion: string
  evidencia_url: string | null
  orden_id: string
  fecha_realizacion: string
}

export interface Repuesto {
  id: string
  nombre: string
  costo: number
  stock: number
}

export interface DetalleRepuesto {
  id: string
  mantenimiento_id: string
  repuesto_id: string
  cantidad: number
}

export type EstadoCotizacion = 'pendiente' | 'aprobada' | 'rechazada'

export interface Cotizacion {
  id: string
  fecha: string
  total: number
  estado: EstadoCotizacion
  cliente_id: string
  descripcion: string
  items: CotizacionItem[]
}

export interface CotizacionItem {
  id: string
  descripcion: string
  cantidad: number
  precio_unitario: number
}

// Tipos extendidos para vistas con relaciones
export interface OrdenTrabajoExtendida extends OrdenTrabajo {
  cliente?: Cliente
  tecnico?: Tecnico
  equipo?: Equipo
}

export interface CotizacionExtendida extends Cotizacion {
  cliente?: Cliente
}

export interface MantenimientoExtendido extends Mantenimiento {
  orden?: OrdenTrabajoExtendida
  repuestos?: (DetalleRepuesto & { repuesto?: Repuesto })[]
}

// Estadísticas del dashboard
export interface DashboardStats {
  totalOrdenes: number
  ordenesPendientes: number
  ordenesCompletadas: number
  totalClientes: number
  totalTecnicos: number
  totalEquipos: number
  ingresosMes: number
  mantenimientosPreventivos: number
  mantenimientosCorrectivos: number
}

// Cotización completa con todas sus relaciones
export interface CotizacionConRelaciones {
  id: string
  fecha: string
  total: number
  estado: EstadoCotizacion
  cliente_id: string
  descripcion: string
  created_at?: string
  numero?: string
  vigencia_dias?: number
  iva?: number
  clientes?: {
    id: string
    nombre_empresa?: string
    nombre: string
    telefono: string
    direccion: string
    usuario_id?: string
    email?: string
  }
  equipos?: {
    id: string
    modelo: string
    serie: string
  }
  tipos_trabajo?: {
    id: string
    nombre: string
  }
  cotizacion_items?: CotizacionItem[]
  cotizacion_evidencia?: EvidenciaCotizacion[]
  items?: CotizacionItem[]
}

// Archivo de evidencia
export interface EvidenciaCotizacion {
  id: string
  cotizacion_id: string
  nombre_archivo: string
  archivo_url: string
  descripcion?: string
  created_at?: string
}

// Imagen de mantenimiento
export interface ImagenMantenimiento {
  id: string
  mantenimiento_id: string
  imagen_url: string
  descripcion?: string
  created_at?: string
}

// Repuesto utilizado en mantenimiento
export interface RepuestoMantenimiento {
  id: string
  mantenimiento_id: string
  repuesto_id: string
  cantidad: number
  repuestos?: {
    id: string
    nombre: string
    costo: number
    stock: number
  }
}
