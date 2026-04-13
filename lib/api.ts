import { createClient } from './supabase/client'
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
  CotizacionItem,
  OrdenTrabajoExtendida,
  CotizacionExtendida,
  MantenimientoExtendido,
  DashboardStats,
  CotizacionConRelaciones,
  EvidenciaCotizacion,
  ImagenMantenimiento,
  DetalleRepuesto,
  RepuestoMantenimiento,
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

// Función para generar contraseña aleatoria segura
function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  const all = uppercase + lowercase + numbers + symbols
  
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export async function createUsuario(
  nombre: string,
  email: string,
  rol: string
): Promise<User | null> {
  try {
    // Validar rol
    if (!['admin', 'tecnico', 'cliente'].includes(rol)) {
      throw new Error('Rol inválido')
    }

    // Generar contraseña aleatoria
    const generatedPassword = generateRandomPassword()

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(generatedPassword, 10)

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

    // Registrar evento de auditoría con email de bienvenida
    await registrarEvento(
      'usuario_creado',
      'usuarios',
      data.id,
      data.id,
      undefined,
      { nombre, email, rol, password: generatedPassword },
      `Nuevo usuario creado: ${nombre} (${email})`,
      [email, 'admin@climatech.local'] // Email al usuario y al admin
    )

    return data
  } catch (error) {
    console.error('Error creando usuario:', error)
    throw error
  }
}

export async function deleteUsuario(usuarioId: string): Promise<boolean> {
  try {
    // Obtener datos del usuario antes de eliminar (para audit)
    const usuario = await getUserById(usuarioId)
    if (!usuario) {
      throw new Error('Usuario no encontrado')
    }

    // Eliminar usuario
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', usuarioId)

    if (error) throw error

    // Registrar evento de auditoría
    await registrarEvento(
      'usuario_eliminado',
      'usuarios',
      usuarioId,
      usuarioId,
      { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      undefined,
      `Usuario eliminado: ${usuario.nombre} (${usuario.email})`,
      ['admin@climatech.local']
    )

    return true
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    throw error
  }
}

export async function updateNombreUsuario(usuarioId: string, nuevoNombre: string): Promise<boolean> {
  try {
    if (!nuevoNombre || nuevoNombre.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío')
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ nombre: nuevoNombre.trim() })
      .eq('id', usuarioId)

    if (error) throw error

    // Registrar evento de auditoría
    await registrarEvento(
      'usuario_actualizado',
      'usuarios',
      usuarioId,
      usuarioId,
      undefined,
      { nombre: nuevoNombre },
      `Nombre de usuario actualizado`,
      []
    )

    return true
  } catch (error) {
    console.error('Error actualizando nombre:', error)
    throw error
  }
}

export async function updatePasswordUsuario(usuarioId: string, nuevaPassword: string): Promise<boolean> {
  try {
    if (!nuevaPassword || nuevaPassword.length < 6) {
      throw new Error('La contraseña debe tener mínimo 6 caracteres')
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10)

    const { error } = await supabase
      .from('usuarios')
      .update({ password: hashedPassword })
      .eq('id', usuarioId)

    if (error) throw error

    // Registrar evento de auditoría
    await registrarEvento(
      'contraseña_actualizada',
      'usuarios',
      usuarioId,
      usuarioId,
      undefined,
      { password_changed: true },
      `Contraseña actualizada`,
      []
    )

    return true
  } catch (error) {
    console.error('Error actualizando contraseña:', error)
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
    
    if (error) throw error
    return data && data.length > 0 ? data[0] : null
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
    
    if (error) throw error
    return data && data.length > 0 ? data[0] : null
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
    
    return (data?.map((orden: Record<string, unknown>) => ({
      ...orden,
      cliente: (orden as Record<string, unknown>).clientes as Cliente,
      tecnico: (orden as Record<string, unknown>).tecnicos as Tecnico,
      equipo: (orden as Record<string, unknown>).equipos as Equipo
    })) || []) as OrdenTrabajoExtendida[]
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
    
    return (data?.map((orden: Record<string, unknown>) => ({
      ...orden,
      cliente: (orden as Record<string, unknown>).clientes as Cliente,
      tecnico: (orden as Record<string, unknown>).tecnicos as Tecnico,
      equipo: (orden as Record<string, unknown>).equipos as Equipo
    })) || []) as OrdenTrabajoExtendida[]
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
    
    return (data?.map((orden: Record<string, unknown>) => ({
      ...orden,
      cliente: (orden as Record<string, unknown>).clientes as Cliente,
      tecnico: (orden as Record<string, unknown>).tecnicos as Tecnico,
      equipo: (orden as Record<string, unknown>).equipos as Equipo
    })) || []) as OrdenTrabajoExtendida[]
  } catch (error) {
    console.error('Error obteniendo órdenes del cliente:', error)
    return []
  }
}

export async function createOrden(data: Omit<OrdenTrabajo, 'id'>, usuario_id?: string): Promise<OrdenTrabajo> {
  try {
    const { data: newOrden, error } = await supabase
      .from('ordenes_trabajo')
      .insert([data])
      .select()
      .single()
    
    if (error) throw error

    // Registrar evento de auditoría
    await registrarEvento(
      'orden_creada',
      'ordenes_trabajo',
      newOrden.id,
      usuario_id,
      undefined,
      { equipo_id: data.equipo_id, cliente_id: data.cliente_id, prioridad: data.prioridad },
      `Nueva orden de trabajo creada`,
      ['admin@climatech.local'] // Email al admin
    )

    return newOrden
  } catch (error) {
    console.error('Error creando orden:', error)
    throw error
  }
}

export async function updateOrden(id: string, data: Partial<OrdenTrabajo>): Promise<OrdenTrabajo | null> {
  try {
    // Obtener orden anterior para comparar
    const ordenAnterior = await getOrdenById(id)

    const { data: updated, error } = await supabase
      .from('ordenes_trabajo')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error

    // Registrar evento según estado
    if (data.estado && ordenAnterior && data.estado !== ordenAnterior.estado) {
      let evento = `orden_${data.estado}`
      const emailDestinatarios: string[] = []
      let descripcion = `Orden actualizada a estado: ${data.estado}`

      if (data.estado === 'asignada' && data.tecnico_id) {
        evento = 'orden_asignada'
        // Obtener email del técnico
        const tecnico = await getTecnicoById(data.tecnico_id)
        if (tecnico?.usuario_id) {
          const usuario = await getUserById(tecnico.usuario_id)
          if (usuario?.email) {
            emailDestinatarios.push(usuario.email)
          }
        }
        descripcion = 'Orden asignada a técnico'
      } else if (data.estado === 'completada') {
        evento = 'trabajo_verificado'
        // Email al cliente
        if (updated.cliente_id) {
          const cliente = await getClienteById(updated.cliente_id)
          if (cliente?.usuario_id) {
            const usuario = await getUserById(cliente.usuario_id)
            if (usuario?.email) {
              emailDestinatarios.push(usuario.email)
            }
          }
        }
        descripcion = 'Trabajo verificado y completado'
      } else if (data.estado === 'pending_verification') {
        evento = 'trabajo_completado'
        // Email al admin
        emailDestinatarios.push('admin@climatech.local')
        descripcion = 'Técnico marcó trabajo como completado'
      }

      // Registrar en auditoría
      await registrarEvento(
        evento,
        'ordenes_trabajo',
        id,
        undefined,
        { estado: ordenAnterior.estado },
        { estado: data.estado },
        descripcion,
        emailDestinatarios.length > 0 ? emailDestinatarios : undefined
      )
    }

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
    
    return (data?.map((m: Record<string, unknown>) => {
      const mRecord = m as Record<string, unknown>
      const ordenData = mRecord.ordenes_trabajo as Record<string, unknown> | undefined
      return {
        ...m,
        orden: ordenData ? {
          ...(ordenData as unknown as OrdenTrabajo),
          cliente: ordenData.clientes as Cliente,
          tecnico: ordenData.tecnicos as Tecnico,
          equipo: ordenData.equipos as Equipo
        } : undefined,
        repuestos: (mRecord.detalle_repuestos as (DetalleRepuesto & { repuesto?: Repuesto })[]) || []
      }
    }) || []) as MantenimientoExtendido[]
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

// Crear relación mantenimiento-repuesto y descontar stock
export async function agregarRepuestoAMantenimiento(
  mantenimientoId: string,
  repuestoId: string,
  cantidad: number
): Promise<DetalleRepuesto> {
  try {
    const { data, error } = await supabase
      .from('detalle_repuestos')
      .insert([{
        mantenimiento_id: mantenimientoId,
        repuesto_id: repuestoId,
        cantidad
      }])
      .select()
      .single()
    
    if (error) throw error
    
    // Descontar del stock del repuesto
    const { data: repuesto, error: repuestoError } = await supabase
      .from('repuestos')
      .select('stock')
      .eq('id', repuestoId)
      .single()
    
    if (repuestoError) throw repuestoError
    
    const nuevoStock = Math.max(0, repuesto.stock - cantidad)
    const { error: updateError } = await supabase
      .from('repuestos')
      .update({ stock: nuevoStock, updated_at: new Date().toISOString() })
      .eq('id', repuestoId)
    
    if (updateError) throw updateError
    
    return data
  } catch (error) {
    console.error('Error agregando repuesto a mantenimiento:', error)
    throw error
  }
}

// Obtener repuestos de un mantenimiento
export async function getRepuestosDelMantenimiento(mantenimientoId: string): Promise<RepuestoMantenimiento[]> {
  try {
    const { data, error } = await supabase
      .from('detalle_repuestos')
      .select(`
        id,
        mantenimiento_id,
        repuesto_id,
        cantidad,
        repuestos (
          id,
          nombre,
          costo
        )
      `)
      .eq('mantenimiento_id', mantenimientoId)
    
    if (error) throw error
    return (data || []) as unknown as RepuestoMantenimiento[]
  } catch (error) {
    console.error('Error obteniendo repuestos del mantenimiento:', error)
    return []
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
        clientes (*),
        cotizacion_items (*)
      `)
    
    if (error) throw error
    
    return (data?.map((c: Record<string, unknown>) => ({
      ...c,
      cliente: (c as Record<string, unknown>).clientes as Cliente,
      items: (c as Record<string, unknown>).cotizacion_items as CotizacionItem[] || []
    })) || []) as CotizacionExtendida[]
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
        clientes (*),
        equipos (*),
        tipos_trabajo:tipo_trabajo_id (*),
        cotizacion_items (*)
      `)
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return (data?.map((c: Record<string, unknown>) => ({
      ...c,
      cliente: (c as Record<string, unknown>).clientes as Cliente,
      items: (c as Record<string, unknown>).cotizacion_items as CotizacionItem[] || []
    })) || []) as CotizacionExtendida[]
  } catch (error) {
    console.error('Error obteniendo cotizaciones del cliente:', error)
    return []
  }
}

export async function createCotizacion(data: Omit<Cotizacion, 'id' | 'items'> & { items?: CotizacionItem[] }): Promise<Cotizacion> {
  try {
    // Extraer items del objeto data
    const { items, ...cotizacionData } = data

    // Crear la cotización sin items
    const { data: newCotizacion, error: cotizacionError } = await supabase
      .from('cotizaciones')
      .insert([cotizacionData])
      .select()
      .single()

    if (cotizacionError) throw cotizacionError

    // Si hay items, insertarlos en la tabla cotizacion_items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        cotizacion_id: newCotizacion.id,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario
      }))

      const { error: itemsError } = await supabase
        .from('cotizacion_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError
    }

    // Retornar la cotización con los items incluidos (para compatibilidad con el frontend)
    return {
      ...newCotizacion,
      items: items || []
    }
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
      .reduce((sum: number, c: Record<string, unknown>) => sum + (((c as Record<string, unknown>).total as number) || 0), 0)

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

// Dashboard: Ingresos por mes
export async function getOrdenesPorMes(): Promise<{ mes: string; ingresos: number }[]> {
  try {
    const { data: cotizaciones } = await supabase
      .from('cotizaciones')
      .select('total, created_at, estado')
      .eq('estado', 'aprobada')

    const cotizacionesData = cotizaciones || []
    const meses: { [key: string]: number } = {}

    cotizacionesData.forEach(c => {
      const fecha = new Date(c.created_at)
      const mesAno = fecha.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
      meses[mesAno] = (meses[mesAno] || 0) + (c.total || 0)
    })

    return Object.entries(meses).map(([mes, ingresos]) => ({ mes, ingresos })).slice(-6)
  } catch (error) {
    console.error('Error obteniendo órdenes por mes:', error)
    return []
  }
}

// Dashboard: Técnicos más activos
export async function getTecnicosProductividad(): Promise<{ nombre: string; ordenes: number }[]> {
  try {
    const { data } = await supabase
      .from('ordenes_trabajo')
      .select('*, tecnicos(nombre)')

    const stats: Array<{ id: string; nombre: string; count: number }> = []

    if (Array.isArray(data)) {
      data.forEach((orden: Record<string, unknown>) => {
        const tecnicoId = orden.tecnico_id as string
        const tecnicoObj = ((orden as Record<string, unknown>).tecnicos as Record<string, unknown> | undefined)
        const tecnicoNombre = (tecnicoObj?.nombre as string) || 'Sin asignar'
        
        if (tecnicoId) {
          const existing = stats.find(t => t.id === tecnicoId)
          if (existing) {
            existing.count += 1
          } else {
            stats.push({ id: tecnicoId, nombre: tecnicoNombre, count: 1 })
          }
        }
      })
    }

    return stats
      .map(t => ({ nombre: t.nombre, ordenes: t.count }))
      .sort((a, b) => b.ordenes - a.ordenes)
      .slice(0, 5)
  } catch (error) {
    console.error('Error obteniendo productividad técnicos:', error)
    return []
  }
}

// Subir imagen a mantenimiento
export async function subirImagenMantenimiento(
  mantenimientoId: string,
  archivo: File,
  descripcion?: string
): Promise<ImagenMantenimiento> {
  try {
    const formData = new FormData()
    formData.append('file', archivo)
    formData.append('mantenimientoId', mantenimientoId)
    if (descripcion) formData.append('descripcion', descripcion)

    const response = await fetch('/api/imagen-mantenimiento-upload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Error al subir imagen')
    }

    return data
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error subiendo imagen:', msg)
    throw error
  }
}

// Obtener imágenes de mantenimiento
export async function getImagenesMantenimiento(mantenimientoId: string): Promise<ImagenMantenimiento[]> {
  try {
    const { data, error } = await supabase
      .from('mantenimiento_evidencia')
      .select('*')
      .eq('mantenimiento_id', mantenimientoId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo imágenes:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error obteniendo imágenes mantenimiento:', error)
    return []
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
    pending_verification: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30',
    verificada: 'bg-success/10 text-success border-success/30',
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

// ============ TIPOS DE EQUIPO ============

export async function getTiposEquipo(): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await supabase
      .from('tipos_equipo')
      .select('*')
      .order('nombre', { ascending: true })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo tipos de equipo:', error)
    return []
  }
}

export async function createTipoEquipo(
  nombre: string,
  descripcion?: string,
  marca?: string
): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase
      .from('tipos_equipo')
      .insert([{ nombre, descripcion, marca }])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creando tipo de equipo:', error)
    throw error
  }
}

export async function updateTipoEquipo(
  id: string,
  nombre?: string,
  descripcion?: string,
  marca?: string
): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase
      .from('tipos_equipo')
      .update({ nombre, descripcion, marca, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error actualizando tipo de equipo:', error)
    throw error
  }
}

export async function deleteTipoEquipo(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tipos_equipo')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error eliminando tipo de equipo:', error)
    return false
  }
}

// ============ TIPOS DE TRABAJO ============

export async function getTiposTrabajo(): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await supabase
      .from('tipos_trabajo')
      .select('*')
      .order('nombre', { ascending: true })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo tipos de trabajo:', error)
    return []
  }
}

export async function createTipoTrabajo(
  nombre: string,
  descripcion?: string,
  requiere_repuestos: boolean = false
): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase
      .from('tipos_trabajo')
      .insert([{ nombre, descripcion, requiere_repuestos }])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creando tipo de trabajo:', error)
    throw error
  }
}

export async function updateTipoTrabajo(
  id: string,
  nombre?: string,
  descripcion?: string,
  requiere_repuestos?: boolean
): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase
      .from('tipos_trabajo')
      .update({ 
        nombre, 
        descripcion, 
        requiere_repuestos,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error actualizando tipo de trabajo:', error)
    throw error
  }
}

export async function deleteTipoTrabajo(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tipos_trabajo')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error eliminando tipo de trabajo:', error)
    return false
  }
}

// ============ REPUESTOS EN REVISIÓN ============

export async function getRepuestosEnRevision(clienteId?: string): Promise<Record<string, unknown>[]> {
  try {
    let query = supabase
      .from('repuestos_revision')
      .select('*')
      .eq('estado', 'pending')
      .order('created_at', { ascending: false })
    
    if (clienteId) {
      query = query.eq('cliente_id', clienteId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo repuestos en revisión:', error)
    return []
  }
}

export async function createRepuestoEnRevision(
  nombre: string,
  clienteId: string,
  cantidad: number = 1,
  precio_estimado?: number,
  descripcion?: string
): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase
      .from('repuestos_revision')
      .insert([{
        nombre,
        cliente_id: clienteId,
        cantidad_solicitada: cantidad,
        precio_estimado,
        descripcion,
        estado: 'pending'
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creando repuesto en revisión:', error)
    throw error
  }
}

export async function aprobarRepuestoEnRevision(
  id: string,
  adminId: string
): Promise<boolean> {
  try {
    // Obtener el repuesto en revisión
    const { data: revision, error: errorRev } = await supabase
      .from('repuestos_revision')
      .select('*')
      .eq('id', id)
      .single()
    
    if (errorRev || !revision) throw errorRev

    // Crear repuesto en tabla principal
    const { error: errorCreate } = await supabase
      .from('repuestos')
      .insert([{
        nombre: revision.nombre,
        costo: revision.precio_estimado || 0,
        stock: revision.cantidad_solicitada || 0
      }])
    
    if (errorCreate) throw errorCreate

    // Actualizar estado en revisión
    const { error: errorUpdate } = await supabase
      .from('repuestos_revision')
      .update({
        estado: 'aprobado',
        aprobado_por: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (errorUpdate) throw errorUpdate
    return true
  } catch (error) {
    console.error('Error aprobando repuesto:', error)
    throw error
  }
}

export async function rechazarRepuestoEnRevision(
  id: string,
  razon: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('repuestos_revision')
      .update({
        estado: 'rechazado',
        razon_rechazo: razon,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error rechazando repuesto:', error)
    throw error
  }
}

// ============ COTIZACIONES PHASE 3-6 ============

// Phase 3: Cliente solicita cotización
export async function crearSolicitudCotizacion(
  clienteId: string,
  equipoId: string,
  tipoTrabajoId: string,
  descripcion?: string
): Promise<CotizacionConRelaciones> {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .insert([{
        cliente_id: clienteId,
        equipo_id: equipoId,
        tipo_trabajo_id: tipoTrabajoId,
        descripcion,
        estado: 'pendiente',
        total: 0
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error de Supabase:', error.message || error)
      throw new Error(error.message || 'Error al crear cotización')
    }

    // Registrar evento de auditoría
    const cliente = await getClienteById(clienteId)
    await registrarEvento(
      'cotizacion_creada',
      'cotizaciones',
      data.id,
      cliente?.usuario_id,
      undefined,
      { cliente_id: clienteId, equipo_id: equipoId, tipo_trabajo_id: tipoTrabajoId },
      'Nueva cotización solicitada',
      cliente?.usuario_id ? [cliente.usuario_id] : undefined
    )
    
    return data
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Error desconocido'
    console.error('Error creando cotización:', errorMessage)
    throw new Error(errorMessage)
  }
}

// Phase 4: Admin obtiene cotizaciones pendientes
export async function getCotizacionesByEstado(estado: string): Promise<CotizacionConRelaciones[]> {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        clientes (*),
        equipos (*),
        tipos_trabajo:tipo_trabajo_id (*)
      `)
      .eq('estado', estado)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error(`Error obteniendo cotizaciones con estado ${estado}:`, error)
    return []
  }
}

// Phase 4: Admin obtiene cotización completa con items y evidencia
export async function getCotizacionCompleta(cotizacionId: string): Promise<CotizacionConRelaciones> {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        clientes (*),
        equipos (*),
        tipos_trabajo:tipo_trabajo_id (*),
        cotizacion_items (*),
        cotizacion_evidencia (*)
      `)
      .eq('id', cotizacionId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error obteniendo cotización completa:', error)
    throw error
  }
}

// Phase 4: Admin actualiza cotización con detalles
export async function completarCotizacion(
  cotizacionId: string,
  descripcion: string,
  total: number,
  estado?: string
): Promise<Record<string, unknown>> {
  try {
    console.log('Completando cotización con:', { cotizacionId, descripcion, total, estado })
    
    // Obtener cotización anterior
    const cotizacionAnterior = await getCotizacionCompleta(cotizacionId)

    const updateData: Record<string, unknown> = {
      descripcion,
      total,
      updated_at: new Date().toISOString()
    }
    if (estado) {
      updateData.estado = estado
    }
    
    const { data, error } = await supabase
      .from('cotizaciones')
      .update(updateData)
      .eq('id', cotizacionId)
      .select()
      .single()
    
    if (error) {
      console.error('Error de Supabase al completar:', error.message || error)
      throw new Error(error.message || 'Error al actualizar cotización')
    }

    // Registrar evento de auditoría
    const emailDestinatarios: string[] = []
    if (cotizacionAnterior?.clientes?.usuario_id) {
      const usuario = await getUserById(cotizacionAnterior.clientes.usuario_id)
      if (usuario?.email) {
        emailDestinatarios.push(usuario.email)
      }
    }

    await registrarEvento(
      'cotizacion_completada',
      'cotizaciones',
      cotizacionId,
      undefined,
      { total: cotizacionAnterior?.total },
      { total, estado: updateData.estado || 'pendiente', cantidad_items: cotizacionAnterior?.cotizacion_items?.length || 0 },
      descripcion,
      emailDestinatarios.length > 0 ? emailDestinatarios : undefined
    )
    
    return data
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error) || 'Error desconocido'
    console.error('Error completando cotización:', errorMsg)
    throw new Error(errorMsg)
  }
}

// Phase 4: Admin crea items de cotización
export async function crearCotizacionItem(
  cotizacionId: string,
  descripcion: string,
  cantidad: number,
  precioUnitario: number,
  repuestoId?: string
): Promise<Record<string, unknown>> {
  try {
    const itemData: Record<string, unknown> = {
      cotizacion_id: cotizacionId,
      descripcion,
      cantidad,
      precio_unitario: precioUnitario
    }
    if (repuestoId) {
      itemData.repuesto_id = repuestoId
    }
    
    const { data, error } = await supabase
      .from('cotizacion_items')
      .insert([itemData])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creando item de cotización:', error)
    throw error
  }
}

// Phase 4: Actualizar item de cotización
export async function actualizarCotizacionItem(
  itemId: string,
  descripcion: string,
  cantidad: number,
  precioUnitario: number,
  repuestoId?: string
): Promise<Record<string, unknown>> {
  try {
    const updateData: Record<string, unknown> = {
      descripcion,
      cantidad,
      precio_unitario: precioUnitario,
      updated_at: new Date().toISOString()
    }
    if (repuestoId) {
      updateData.repuesto_id = repuestoId
    } else {
      updateData.repuesto_id = null
    }
    
    const { data, error } = await supabase
      .from('cotizacion_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error actualizando item de cotización:', error)
    throw error
  }
}

// Phase 4: Eliminar item de cotización
export async function eliminarCotizacionItem(itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cotizacion_items')
      .delete()
      .eq('id', itemId)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error eliminando item de cotización:', error)
    throw error
  }
}

// Phase 5: Subir evidencia a Supabase Storage
export async function subirEvidenciaCotizacion(
  cotizacionId: string,
  archivo: File,
  descripcion?: string
): Promise<EvidenciaCotizacion> {
  try {
    const formData = new FormData()
    formData.append('file', archivo)
    formData.append('cotizacionId', cotizacionId)
    if (descripcion) formData.append('descripcion', descripcion)

    console.log('Subiendo archivo:', archivo.name)
    const response = await fetch('/api/evidencia-upload', {
      method: 'POST',
      body: formData
    })

    console.log('Respuesta del servidor:', response.status)
    const data = await response.json()
    console.log('Datos retornados:', data)

    if (!response.ok) {
      throw new Error(data.error || 'Error al subir archivo')
    }

    return data
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error) || 'Error desconocido'
    console.error('Error subiendo evidencia:', errorMsg)
    throw error
  }
}

// Phase 5: Obtener evidencia de cotización
export async function getEvidenciaCotizacion(cotizacionId: string): Promise<EvidenciaCotizacion[]> {
  try {
    console.log('Obteniendo evidencia desde BD para:', cotizacionId)
    
    // Obtener desde la BD en lugar de Storage
    const { data, error } = await supabase
      .from('cotizacion_evidencia')
      .select('*')
      .eq('cotizacion_id', cotizacionId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error obteniendo de BD:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      return []
    }
    
    console.log('Registros encontrados en BD:', data?.length || 0)
    console.log('Todos los registros:', data)
    return data || []
  } catch (error) {
    console.error('Error obteniendo evidencia:', error)
    return []
  }
}

// Phase 6: Cliente aprueba/rechaza cotización
export async function cambiarEstadoCotizacion(
  cotizacionId: string,
  estado: 'aprobada' | 'rechazada',
  comentarios?: string
): Promise<Cotizacion> {
  try {
    // Si se aprueba, descontar stock de los repuestos
    if (estado === 'aprobada') {
      // Obtener todos los items de la cotización
      const { data: items, error: itemsError } = await supabase
        .from('cotizacion_items')
        .select('repuesto_id, cantidad')
        .eq('cotizacion_id', cotizacionId)
      
      if (itemsError) {
        console.error('Error obteniendo items:', itemsError)
      } else if (items && items.length > 0) {
        // Procesar cada item que tenga repuesto_id
        for (const item of items) {
          if (item.repuesto_id && item.cantidad > 0) {
            console.log(`Descontando ${item.cantidad} unidades del repuesto: ${item.repuesto_id}`)
            
            // Obtener stock actual del repuesto
            const { data: repuesto, error: repuestoError } = await supabase
              .from('repuestos')
              .select('stock')
              .eq('id', item.repuesto_id)
              .single()
            
            if (repuestoError) {
              console.warn(`Error obteniendo repuesto ${item.repuesto_id}:`, repuestoError)
              continue
            }
            
            if (repuesto) {
              const nuevoStock = Math.max(0, repuesto.stock - item.cantidad)
              
              // Actualizar stock
              const { error: updateError } = await supabase
                .from('repuestos')
                .update({ stock: nuevoStock, updated_at: new Date().toISOString() })
                .eq('id', item.repuesto_id)
              
              if (updateError) {
                console.error(`Error actualizando stock de ${item.repuesto_id}:`, updateError)
              } else {
                console.log(`Stock actualizado: ${repuesto.stock} → ${nuevoStock}`)
              }
            }
          }
        }
      }
    }
    
    // Obtener cotización antes de actualizar
    const cotizacionAnterior = await getCotizacionCompleta(cotizacionId)

    // Actualizar estado de la cotización
    const updateData: Record<string, unknown> = {
      estado,
      updated_at: new Date().toISOString()
    }
    
    if (comentarios) {
      updateData.descripcion = comentarios
    }
    
    const { data, error } = await supabase
      .from('cotizaciones')
      .update(updateData)
      .eq('id', cotizacionId)
      .select()
      .single()
    
    if (error) throw error

    // Registrar evento de auditoría
    const evento = `cotizacion_${estado}`
    const emailDestinatarios: string[] = []
    let descripcion = `Cotización ${estado}`

    if (cotizacionAnterior?.clientes?.usuario_id) {
      const usuario = await getUserById(cotizacionAnterior.clientes.usuario_id)
      if (usuario?.email) {
        emailDestinatarios.push(usuario.email)
      }
    }
    
    if (estado === 'rechazada' && comentarios) {
      descripcion = `Cotización rechazada: ${comentarios}`
    }

    await registrarEvento(
      evento,
      'cotizaciones',
      cotizacionId,
      undefined,
      { estado: cotizacionAnterior?.estado },
      { estado, total: data.total },
      descripcion,
      emailDestinatarios.length > 0 ? emailDestinatarios : undefined
    )

    return data
  } catch (error) {
    console.error('Error cambiando estado de cotización:', error)
    throw error
  }
}

// ============ EXPORTAR COTIZACIONES A PDF ============

export async function exportarCotizacionPDF(cotizacionId: string): Promise<void> {
  try {
    // Obtener cotización con todos los detalles
    const cotizacion = await getCotizacionCompleta(cotizacionId)
    
    // Importar jsPDF dinámicamente
    const { jsPDF } = await import('jspdf')
    
    const doc = new (jsPDF as unknown as typeof jsPDF)()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 15
    
    // Encabezado
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('COTIZACIÓN', 15, yPosition)
    
    // Logo/Empresa
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('ClimaTech - Mantenimiento de Climatización', 15, yPosition + 8)
    
    yPosition += 20
    
    // Información general
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)
    doc.text(`Número: ${cotizacion.numero}`, 15, yPosition)
    yPosition += 6
    doc.text(`Fecha: ${formatDate(cotizacion.created_at || '')}`, 15, yPosition)
    yPosition += 6
    doc.text(`Vigencia: ${cotizacion.vigencia_dias} días`, 15, yPosition)
    yPosition += 6
    
    // Información del cliente
    yPosition += 6
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('Cliente:', 15, yPosition)
    yPosition += 6
    doc.setFontSize(10)
    doc.text(`${cotizacion.clientes?.nombre || 'N/A'}`, 15, yPosition)
    yPosition += 5
    doc.text(`Email: ${cotizacion.clientes?.email || 'N/A'}`, 15, yPosition)
    yPosition += 5
    doc.text(`Teléfono: ${cotizacion.clientes?.telefono || 'N/A'}`, 15, yPosition)
    
    yPosition += 10
    
    // Tabla de items
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)
    doc.text('Detalle de servicios:', 15, yPosition)
    yPosition += 8
    
    // Encabezados tabla
    doc.setFillColor(70, 130, 180)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    
    const colWidth = 120
    const cantWidth = 30
    const valorWidth = 35
    
    doc.rect(15, yPosition - 5, colWidth, 6, 'F')
    doc.rect(15 + colWidth, yPosition - 5, cantWidth, 6, 'F')
    doc.rect(15 + colWidth + cantWidth, yPosition - 5, valorWidth, 6, 'F')
    
    doc.text('Descripción', 17, yPosition)
    doc.text('Cant.', 15 + colWidth + 5, yPosition)
    doc.text('V. Unit.', 15 + colWidth + cantWidth + 5, yPosition)
    
    yPosition += 8
    doc.setTextColor(40, 40, 40)
    
    // Items
    let subtotal = 0
    cotizacion.cotizacion_items?.forEach((item: CotizacionItem) => {
      const descripcion = item.descripcion || 'Item'
      const cantidad = item.cantidad || 0
      const valor = item.precio_unitario || 0
      const total = cantidad * valor
      subtotal += total
      
      doc.setFontSize(9)
      doc.text(String(descripcion).substring(0, 40), 17, yPosition)
      doc.text(String(cantidad), 15 + colWidth + 10, yPosition)
      doc.text(formatCurrency(Number(valor)), 15 + colWidth + cantWidth + 5, yPosition)
      yPosition += 6
      
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = 15
      }
    })
    
    // Totales
    yPosition += 8
    doc.setDrawColor(200, 200, 200)
    doc.line(15, yPosition, pageWidth - 15, yPosition)
    yPosition += 8
    
    const iva = subtotal * (cotizacion.iva || 0.19)
    const total = subtotal + iva
    
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    doc.text(`Subtotal:`, pageWidth - 50, yPosition)
    doc.text(formatCurrency(subtotal), pageWidth - 20, yPosition, { align: 'right' })
    
    yPosition += 7
    doc.text(`IVA (${((cotizacion.iva || 0.19) * 100).toFixed(0)}%):`, pageWidth - 50, yPosition)
    doc.text(formatCurrency(iva), pageWidth - 20, yPosition, { align: 'right' })
    
    yPosition += 7
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Total:`, pageWidth - 50, yPosition)
    doc.text(formatCurrency(total), pageWidth - 20, yPosition, { align: 'right' })
    
    // Pie de página
    yPosition = pageHeight - 20
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Este documento es una cotización. Para su validez requiere aprobación del cliente.', 15, yPosition)
    doc.text(`Documento generado: ${new Date().toLocaleDateString('es-ES')}`, 15, yPosition + 5)
    
    // Descargar
    doc.save(`Cotizacion_${cotizacion.numero}.pdf`)
  } catch (error) {
    console.error('Error exportando cotización a PDF:', error)
    throw error
  }
}

// ============ AUDITORÍA Y NOTIFICACIONES ============

export async function registrarEvento(
  evento: string,
  tabla: string,
  registroId: string,
  usuarioId?: string,
  cambiosAnteriores?: Record<string, unknown>,
  cambiosNuevos?: Record<string, unknown>,
  descripcion?: string,
  emailDestinatarios?: string[]
): Promise<Record<string, unknown>> {
  try {
    // Si hay usuario, obtener sus datos
    let usuarioEmail = ''
    let usuarioRol = ''
    
    if (usuarioId) {
      const usuario = await getUserById(usuarioId)
      if (usuario) {
        usuarioEmail = usuario.email
        usuarioRol = usuario.rol
      }
    }

    // Registrar en tabla audit_logs
    const { data: auditLog, error } = await supabase
      .from('audit_logs')
      .insert([
        {
          evento,
          tabla,
          registro_id: registroId,
          usuario_id: usuarioId || null,
          usuario_email: usuarioEmail,
          usuario_rol: usuarioRol,
          cambios_anteriores: cambiosAnteriores || null,
          cambios_nuevos: cambiosNuevos || null,
          descripcion,
          email_destinatarios: emailDestinatarios || [],
          email_enviado: false
        }
      ])
      .select()
      .single()

    if (error) throw error

    // Trigger para enviar email via Edge Function
    if (emailDestinatarios && emailDestinatarios.length > 0) {
      console.log(`Enviando notificación por evento: ${evento}`)
      
      // Llamar a Edge Function para enviar email
      try {
        await fetch('/api/send-notification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auditLogId: auditLog.id,
            evento,
            tabla,
            descripcion,
            emailDestinatarios,
            cambiosNuevos
          })
        })
      } catch (emailError) {
        console.error('Error enviando email de notificación:', emailError)
        // No fallar si el email no se envía
      }
    }

    return auditLog
  } catch (error) {
    console.error('Error registrando evento:', error)
    return {}
  }
}

export async function getAuditLogs(
  filtros?: {
    evento?: string
    tabla?: string
    usuarioId?: string
    desde?: string
    hasta?: string
  }
): Promise<Record<string, unknown>[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (filtros?.evento) {
      query = query.eq('evento', filtros.evento)
    }
    if (filtros?.tabla) {
      query = query.eq('tabla', filtros.tabla)
    }
    if (filtros?.usuarioId) {
      query = query.eq('usuario_id', filtros.usuarioId)
    }
    if (filtros?.desde) {
      query = query.gte('created_at', filtros.desde)
    }
    if (filtros?.hasta) {
      query = query.lte('created_at', filtros.hasta)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo audit logs:', error)
    return []
  }
}
