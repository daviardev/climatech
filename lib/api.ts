import { createClient } from './supabas/client'
import * as bcrypt from 'bcryptjs'
import type {
  User,
  Cliente,
  Tecnico,
  Equipo,
  OrdenTrabajo,
  Mantenimiento,
  Repuesto,
  Cotizacion,
  OrdenTrabajoExtendida,
  CotizacionExtendida,
  MantenimientoExtendido,
  DashboardStats,
} from './types'

const supabase = createClient()

// ============ AUTENTICACIÓN ============
export async function login(email: string, password: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error || !data) {
      console.error('Error en login:', error)
      return null
    }

    // Comparar contraseña hasheada
    const isPasswordValid = await bcrypt.compare(password, data.password)
    
    if (!isPasswordValid) {
      console.error('Contraseña inválida')
      return null
    }

    return data
  } catch (error) {
    console.error('Error en login:', error)
    return null
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error obteniendo usuario:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return null
  }
}

export async function getUsuarios(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    return []
  }
}

export async function createUsuario(
  nombre: string,
  email: string,
  password: string,
  rol: string
): Promise<User | null> {
  try {
    // Validar rol
    if (!['admin', 'tecnico', 'cliente'].includes(rol)) {
      throw new Error('Rol inválido')
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insertar usuario
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          nombre,
          email,
          password: hashedPassword,
          rol
        }
      ])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creando usuario:', error)
    throw error
  }
}

export async function getUsuariosByRole(rol: string): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', rol)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error(`Error obteniendo usuarios con rol ${rol}:`, error)
    return []
  }
}

export async function getAvailableUsuariosForCliente(): Promise<User[]> {
  try {
    // Obtener todos los usuarios con rol 'cliente'
    const { data: usuariosCliente, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', 'cliente')
    
    if (errorUsuarios) throw errorUsuarios

    // Obtener IDs de usuarios que ya tienen cliente asignado
    const { data: clientesUsers, error: errorClientes } = await supabase
      .from('clientes')
      .select('usuario_id')
    
    if (errorClientes) throw errorClientes

    const usedUserIds = new Set(clientesUsers?.map(c => c.usuario_id) || [])

    // Filtrar usuarios que NO están en la lista de clientes
    return (usuariosCliente || []).filter(u => !usedUserIds.has(u.id))
  } catch (error) {
    console.error('Error obteniendo usuarios disponibles:', error)
    return []
  }
}

// ============ CLIENTES ============
export async function getClientes(): Promise<Cliente[]> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo clientes:', error)
    return []
  }
}

export async function getClienteById(id: string): Promise<Cliente | null> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error obteniendo cliente:', error)
    return null
  }
}

export async function getClienteByUsuarioId(usuarioId: string): Promise<Cliente | null> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error obteniendo cliente por usuario:', error)
    return null
  }
}

export async function createCliente(data: Omit<Cliente, 'id'>): Promise<Cliente> {
  try {
    const { data: newCliente, error } = await supabase
      .from('clientes')
      .insert([data])
      .select()
      .single()
    
    if (error) throw error
    return newCliente
  } catch (error) {
    console.error('Error creando cliente:', error)
    throw error
  }
}

export async function updateCliente(id: string, data: Partial<Cliente>): Promise<Cliente | null> {
  try {
    const { data: updated, error } = await supabase
      .from('clientes')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  } catch (error) {
    console.error('Error actualizando cliente:', error)
    return null
  }
}

export async function deleteCliente(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error eliminando cliente:', error)
    return false
  }
}

// ============ TÉCNICOS ============
export async function getTecnicos(): Promise<Tecnico[]> {
  try {
    const { data, error } = await supabase
      .from('tecnicos')
      .select('*')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo técnicos:', error)
    return []
  }
}

export async function getTecnicoById(id: string): Promise<Tecnico | null> {
  try {
    const { data, error } = await supabase
      .from('tecnicos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error obteniendo técnico:', error)
    return null
  }
}

export async function getTecnicoByUsuarioId(usuarioId: string): Promise<Tecnico | null> {
  try {
    const { data, error } = await supabase
      .from('tecnicos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error obteniendo técnico por usuario:', error)
    return null
  }
}

export async function createTecnico(data: Omit<Tecnico, 'id'>): Promise<Tecnico> {
  try {
    const { data: newTecnico, error } = await supabase
      .from('tecnicos')
      .insert([data])
      .select()
      .single()
    
    if (error) throw error
    return newTecnico
  } catch (error) {
    console.error('Error creando técnico:', error)
    throw error
  }
}

export async function updateTecnico(id: string, data: Partial<Tecnico>): Promise<Tecnico | null> {
  try {
    const { data: updated, error } = await supabase
      .from('tecnicos')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  } catch (error) {
    console.error('Error actualizando técnico:', error)
    return null
  }
}

// ============ EQUIPOS ============
export async function getEquipos(): Promise<Equipo[]> {
  try {
    const { data, error } = await supabase
      .from('equipos')
      .select('*')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo equipos:', error)
    return []
  }
}

export async function getEquipoById(id: string): Promise<Equipo | null> {
  try {
    const { data, error } = await supabase
      .from('equipos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error obteniendo equipo:', error)
    return null
  }
}

export async function getEquiposByClienteId(clienteId: string): Promise<Equipo[]> {
  try {
    const { data, error } = await supabase
      .from('equipos')
      .select('*')
      .eq('cliente_id', clienteId)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo equipos del cliente:', error)
    return []
  }
}

export async function createEquipo(data: Omit<Equipo, 'id'>): Promise<Equipo> {
  try {
    const { data: newEquipo, error } = await supabase
      .from('equipos')
      .insert([data])
      .select()
      .single()
    
    if (error) throw error
    return newEquipo
  } catch (error) {
    console.error('Error creando equipo:', error)
    throw error
  }
}

export async function updateEquipo(id: string, data: Partial<Equipo>): Promise<Equipo | null> {
  try {
    const { data: updated, error } = await supabase
      .from('equipos')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  } catch (error) {
    console.error('Error actualizando equipo:', error)
    return null
  }
}

export async function deleteEquipo(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('equipos')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error eliminando equipo:', error)
    return false
  }
}

// ============ ÓRDENES DE TRABAJO ============
export async function getOrdenes(): Promise<OrdenTrabajoExtendida[]> {
  try {
    const { data, error } = await supabase
      .from('ordenes_trabajo')
      .select(`
        *,
        clientes (*),
        tecnicos (*),
        equipos (*)
      `)
    
    if (error) throw error
    
    return data?.map((orden: any) => ({
      ...orden,
      cliente: orden.clientes,
      tecnico: orden.tecnicos,
      equipo: orden.equipos
    })) || []
  } catch (error) {
    console.error('Error obteniendo órdenes:', error)
    return []
  }
}

export async function getOrdenById(id: string): Promise<OrdenTrabajoExtendida | null> {
  try {
    const { data, error } = await supabase
      .from('ordenes_trabajo')
      .select(`
        *,
        clientes (*),
        tecnicos (*),
        equipos (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    return {
      ...data,
      cliente: data.clientes,
      tecnico: data.tecnicos,
      equipo: data.equipos
    }
  } catch (error) {
    console.error('Error obteniendo orden:', error)
    return null
  }
}

export async function getOrdenesByTecnicoId(tecnicoId: string): Promise<OrdenTrabajoExtendida[]> {
  try {
    const { data, error } = await supabase
      .from('ordenes_trabajo')
      .select(`
        *,
        clientes (*),
        tecnicos (*),
        equipos (*)
      `)
      .eq('tecnico_id', tecnicoId)
    
    if (error) throw error
    
    return data?.map((orden: any) => ({
      ...orden,
      cliente: orden.clientes,
      tecnico: orden.tecnicos,
      equipo: orden.equipos
    })) || []
  } catch (error) {
    console.error('Error obteniendo órdenes del técnico:', error)
    return []
  }
}

export async function getOrdenesByClienteId(clienteId: string): Promise<OrdenTrabajoExtendida[]> {
  try {
    const { data, error } = await supabase
      .from('ordenes_trabajo')
      .select(`
        *,
        clientes (*),
        tecnicos (*),
        equipos (*)
      `)
      .eq('cliente_id', clienteId)
    
    if (error) throw error
    
    return data?.map((orden: any) => ({
      ...orden,
      cliente: orden.clientes,
      tecnico: orden.tecnicos,
      equipo: orden.equipos
    })) || []
  } catch (error) {
    console.error('Error obteniendo órdenes del cliente:', error)
    return []
  }
}

export async function createOrden(data: Omit<OrdenTrabajo, 'id'>): Promise<OrdenTrabajo> {
  try {
    const { data: newOrden, error } = await supabase
      .from('ordenes_trabajo')
      .insert([data])
      .select()
      .single()
    
    if (error) throw error
    return newOrden
  } catch (error) {
    console.error('Error creando orden:', error)
    throw error
  }
}

export async function updateOrden(id: string, data: Partial<OrdenTrabajo>): Promise<OrdenTrabajo | null> {
  try {
    const { data: updated, error } = await supabase
      .from('ordenes_trabajo')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  } catch (error) {
    console.error('Error actualizando orden:', error)
    return null
  }
}

// ============ MANTENIMIENTOS ============
export async function getMantenimientos(): Promise<MantenimientoExtendido[]> {
  try {
    const { data, error } = await supabase
      .from('mantenimientos')
      .select(`
        *,
        ordenes_trabajo (
          *,
          clientes (*),
          tecnicos (*),
          equipos (*)
        ),
        detalle_repuestos (
          *,
          repuestos (*)
        )
      `)
    
    if (error) throw error
    
    return data?.map((m: any) => ({
      ...m,
      orden: m.ordenes_trabajo ? {
        ...m.ordenes_trabajo,
        cliente: m.ordenes_trabajo.clientes,
        tecnico: m.ordenes_trabajo.tecnicos,
        equipo: m.ordenes_trabajo.equipos
      } : undefined,
      repuestos: m.detalle_repuestos || []
    })) || []
  } catch (error) {
    console.error('Error obteniendo mantenimientos:', error)
    return []
  }
}

export async function getMantenimientosByOrdenId(ordenId: string): Promise<Mantenimiento[]> {
  try {
    const { data, error } = await supabase
      .from('mantenimientos')
      .select('*')
      .eq('orden_id', ordenId)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo mantenimientos de la orden:', error)
    return []
  }
}

export async function createMantenimiento(data: Omit<Mantenimiento, 'id'>): Promise<Mantenimiento> {
  try {
    const { data: newMantenimiento, error } = await supabase
      .from('mantenimientos')
      .insert([data])
      .select()
      .single()
    
    if (error) throw error
    return newMantenimiento
  } catch (error) {
    console.error('Error creando mantenimiento:', error)
    throw error
  }
}

// ============ REPUESTOS ============
export async function getRepuestos(): Promise<Repuesto[]> {
  try {
    const { data, error } = await supabase
      .from('repuestos')
      .select('*')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo repuestos:', error)
    return []
  }
}

export async function createRepuesto(data: Omit<Repuesto, 'id'>): Promise<Repuesto> {
  try {
    const { data: newRepuesto, error } = await supabase
      .from('repuestos')
      .insert([data])
      .select()
      .single()
    
    if (error) throw error
    return newRepuesto
  } catch (error) {
    console.error('Error creando repuesto:', error)
    throw error
  }
}

// ============ COTIZACIONES ============
export async function getCotizaciones(): Promise<CotizacionExtendida[]> {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        clientes (*)
      `)
    
    if (error) throw error
    
    return data?.map((c: any) => ({
      ...c,
      cliente: c.clientes
    })) || []
  } catch (error) {
    console.error('Error obteniendo cotizaciones:', error)
    return []
  }
}

export async function getCotizacionesByClienteId(clienteId: string): Promise<CotizacionExtendida[]> {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        clientes (*)
      `)
      .eq('cliente_id', clienteId)
    
    if (error) throw error
    
    return data?.map((c: any) => ({
      ...c,
      cliente: c.clientes
    })) || []
  } catch (error) {
    console.error('Error obteniendo cotizaciones del cliente:', error)
    return []
  }
}

export async function createCotizacion(data: Omit<Cotizacion, 'id'>): Promise<Cotizacion> {
  try {
    const { data: newCotizacion, error } = await supabase
      .from('cotizaciones')
      .insert([data])
      .select()
      .single()
    
    if (error) throw error
    return newCotizacion
  } catch (error) {
    console.error('Error creando cotización:', error)
    throw error
  }
}

export async function updateCotizacion(id: string, data: Partial<Cotizacion>): Promise<Cotizacion | null> {
  try {
    const { data: updated, error } = await supabase
      .from('cotizaciones')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updated
  } catch (error) {
    console.error('Error actualizando cotización:', error)
    return null
  }
}

// ============ DASHBOARD ============
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [ordenes, clientes, tecnicos, equipos, mantenimientos, cotizaciones] = await Promise.all([
      supabase.from('ordenes_trabajo').select('estado'),
      supabase.from('clientes').select('id'),
      supabase.from('tecnicos').select('id'),
      supabase.from('equipos').select('id'),
      supabase.from('mantenimientos').select('tipo'),
      supabase.from('cotizaciones').select('estado,total')
    ])

    const ordenesData = ordenes.data || []
    const mantenimientosData = mantenimientos.data || []
    const cotizacionesData = cotizaciones.data || []

    const ordenesCompletadas = ordenesData.filter(o => o.estado === 'completada').length
    const ordenesPendientes = ordenesData.filter(o => o.estado === 'pendiente' || o.estado === 'asignada').length
    const mantenimientosPreventivos = mantenimientosData.filter(m => m.tipo === 'preventivo').length
    const mantenimientosCorrectivos = mantenimientosData.filter(m => m.tipo === 'correctivo').length
    const ingresosMes = cotizacionesData
      .filter(c => c.estado === 'aprobada')
      .reduce((sum: number, c: any) => sum + (c.total || 0), 0)

    return {
      totalOrdenes: ordenesData.length,
      ordenesPendientes,
      ordenesCompletadas,
      totalClientes: clientes.data?.length || 0,
      totalTecnicos: tecnicos.data?.length || 0,
      totalEquipos: equipos.data?.length || 0,
      ingresosMes,
      mantenimientosPreventivos,
      mantenimientosCorrectivos
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return {
      totalOrdenes: 0,
      ordenesPendientes: 0,
      ordenesCompletadas: 0,
      totalClientes: 0,
      totalTecnicos: 0,
      totalEquipos: 0,
      ingresosMes: 0,
      mantenimientosPreventivos: 0,
      mantenimientosCorrectivos: 0
    }
  }
}

// ============ HELPERS ============
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function getEstadoColor(estado: string): string {
  const colors: Record<string, string> = {
    pendiente: 'bg-warning/10 text-warning-foreground border-warning/30',
    asignada: 'bg-primary/10 text-primary border-primary/30',
    en_progreso: 'bg-accent/10 text-accent border-accent/30',
    completada: 'bg-success/10 text-success border-success/30',
    cancelada: 'bg-destructive/10 text-destructive border-destructive/30',
    aprobada: 'bg-success/10 text-success border-success/30',
    rechazada: 'bg-destructive/10 text-destructive border-destructive/30'
  }
  return colors[estado] || 'bg-muted text-muted-foreground'
}

export function getPrioridadColor(prioridad: string): string {
  const colors: Record<string, string> = {
    baja: 'bg-muted text-muted-foreground',
    media: 'bg-warning/10 text-warning-foreground',
    alta: 'bg-destructive/10 text-destructive'
  }
  return colors[prioridad] || 'bg-muted text-muted-foreground'
}
