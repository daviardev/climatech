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

export type EstadoOrden = 'pendiente' | 'asignada' | 'en_progreso' | 'completada' | 'cancelada'

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
