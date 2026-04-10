import type {
  User,
  Cliente,
  Tecnico,
  Equipo,
  OrdenTrabajo,
  Mantenimiento,
  Repuesto,
  DetalleRepuesto,
  Cotizacion
} from './types'

// Usuarios del sistema
export const users: User[] = [
  {
    id: '1',
    nombre: 'Admin Principal',
    email: 'admin@climatech.com',
    password: 'admin123',
    rol: 'admin'
  },
  {
    id: '2',
    nombre: 'Carlos Rodríguez',
    email: 'carlos@climatech.com',
    password: 'tecnico123',
    rol: 'tecnico'
  },
  {
    id: '3',
    nombre: 'María García',
    email: 'maria@climatech.com',
    password: 'tecnico123',
    rol: 'tecnico'
  },
  {
    id: '4',
    nombre: 'Empresa ABC S.A.',
    email: 'contacto@empresaabc.com',
    password: 'cliente123',
    rol: 'cliente'
  },
  {
    id: '5',
    nombre: 'Hotel Playa Azul',
    email: 'admin@hotelplayaazul.com',
    password: 'cliente123',
    rol: 'cliente'
  }
]

// Clientes
export const clientes: Cliente[] = [
  {
    id: '1',
    nombre: 'Empresa ABC S.A.',
    telefono: '+57 300 123 4567',
    direccion: 'Calle 45 #23-10, Bogotá',
    usuario_id: '4'
  },
  {
    id: '2',
    nombre: 'Hotel Playa Azul',
    telefono: '+57 315 987 6543',
    direccion: 'Carrera 1 #5-20, Cartagena',
    usuario_id: '5'
  },
  {
    id: '3',
    nombre: 'Centro Comercial Metro',
    telefono: '+57 301 456 7890',
    direccion: 'Avenida El Poblado #50-30, Medellín',
    usuario_id: ''
  },
  {
    id: '4',
    nombre: 'Clínica San Rafael',
    telefono: '+57 318 234 5678',
    direccion: 'Calle 72 #10-45, Bogotá',
    usuario_id: ''
  }
]

// Técnicos
export const tecnicos: Tecnico[] = [
  {
    id: '1',
    nombre: 'Carlos Rodríguez',
    especialidad: 'Aires Acondicionados Split',
    usuario_id: '2',
    disponible: true
  },
  {
    id: '2',
    nombre: 'María García',
    especialidad: 'Sistemas de Refrigeración Industrial',
    usuario_id: '3',
    disponible: true
  },
  {
    id: '3',
    nombre: 'Andrés López',
    especialidad: 'Chillers y Torres de Enfriamiento',
    usuario_id: '',
    disponible: false
  }
]

// Equipos de climatización
export const equipos: Equipo[] = [
  {
    id: '1',
    tipo: 'Aire Acondicionado Split',
    marca: 'Samsung',
    modelo: 'AR24TVHQAWKNCO',
    cliente_id: '1',
    numero_serie: 'SAM-2024-001',
    fecha_instalacion: '2024-01-15'
  },
  {
    id: '2',
    tipo: 'Aire Acondicionado Central',
    marca: 'Carrier',
    modelo: '24ACC636A003',
    cliente_id: '2',
    numero_serie: 'CAR-2023-102',
    fecha_instalacion: '2023-06-20'
  },
  {
    id: '3',
    tipo: 'Chiller',
    marca: 'Trane',
    modelo: 'RTAC200',
    cliente_id: '3',
    numero_serie: 'TRA-2022-055',
    fecha_instalacion: '2022-11-10'
  },
  {
    id: '4',
    tipo: 'Mini Split Inverter',
    marca: 'LG',
    modelo: 'S4-Q12JA3AD',
    cliente_id: '4',
    numero_serie: 'LG-2024-033',
    fecha_instalacion: '2024-03-05'
  },
  {
    id: '5',
    tipo: 'Aire Acondicionado Cassette',
    marca: 'Daikin',
    modelo: 'FCQ100KAVEA',
    cliente_id: '2',
    numero_serie: 'DAI-2023-088',
    fecha_instalacion: '2023-09-12'
  }
]

// Órdenes de trabajo
export const ordenes: OrdenTrabajo[] = [
  {
    id: '1',
    fecha: '2026-04-01',
    estado: 'completada',
    cliente_id: '1',
    tecnico_id: '1',
    equipo_id: '1',
    descripcion: 'Mantenimiento preventivo trimestral',
    prioridad: 'media'
  },
  {
    id: '2',
    fecha: '2026-04-03',
    estado: 'en_progreso',
    cliente_id: '2',
    tecnico_id: '2',
    equipo_id: '2',
    descripcion: 'Revisión por ruido anormal en compresor',
    prioridad: 'alta'
  },
  {
    id: '3',
    fecha: '2026-04-05',
    estado: 'asignada',
    cliente_id: '3',
    tecnico_id: '1',
    equipo_id: '3',
    descripcion: 'Inspección anual de chiller',
    prioridad: 'media'
  },
  {
    id: '4',
    fecha: '2026-04-06',
    estado: 'pendiente',
    cliente_id: '4',
    tecnico_id: null,
    equipo_id: '4',
    descripcion: 'Instalación de filtros nuevos',
    prioridad: 'baja'
  },
  {
    id: '5',
    fecha: '2026-04-07',
    estado: 'pendiente',
    cliente_id: '2',
    tecnico_id: null,
    equipo_id: '5',
    descripcion: 'Reparación de fuga de refrigerante',
    prioridad: 'alta'
  }
]

// Mantenimientos realizados
export const mantenimientos: Mantenimiento[] = [
  {
    id: '1',
    tipo: 'preventivo',
    descripcion: 'Limpieza de filtros, verificación de presiones y recarga de gas refrigerante',
    evidencia_url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400',
    orden_id: '1',
    fecha_realizacion: '2026-04-01'
  },
  {
    id: '2',
    tipo: 'correctivo',
    descripcion: 'Diagnóstico inicial: ruido en compresor. Pendiente cambio de rodamientos.',
    evidencia_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
    orden_id: '2',
    fecha_realizacion: '2026-04-03'
  }
]

// Repuestos disponibles
export const repuestos: Repuesto[] = [
  { id: '1', nombre: 'Filtro de aire estándar', costo: 25000, stock: 50 },
  { id: '2', nombre: 'Gas refrigerante R410A (kg)', costo: 85000, stock: 30 },
  { id: '3', nombre: 'Capacitor de arranque 35uF', costo: 45000, stock: 20 },
  { id: '4', nombre: 'Compresor rotativo 12000 BTU', costo: 850000, stock: 5 },
  { id: '5', nombre: 'Termostato digital', costo: 120000, stock: 15 },
  { id: '6', nombre: 'Motor ventilador evaporador', costo: 280000, stock: 8 },
  { id: '7', nombre: 'Tarjeta electrónica universal', costo: 350000, stock: 6 },
  { id: '8', nombre: 'Kit de rodamientos compresor', costo: 180000, stock: 10 }
]

// Detalle de repuestos usados
export const detalleRepuestos: DetalleRepuesto[] = [
  { id: '1', mantenimiento_id: '1', repuesto_id: '1', cantidad: 2 },
  { id: '2', mantenimiento_id: '1', repuesto_id: '2', cantidad: 1 }
]

// Cotizaciones
export const cotizaciones: Cotizacion[] = [
  {
    id: '1',
    fecha: '2026-04-02',
    total: 1250000,
    estado: 'aprobada',
    cliente_id: '2',
    descripcion: 'Mantenimiento preventivo anual - 5 equipos',
    items: [
      { id: '1', descripcion: 'Mantenimiento preventivo AC Central', cantidad: 1, precio_unitario: 450000 },
      { id: '2', descripcion: 'Mantenimiento preventivo Cassette', cantidad: 1, precio_unitario: 350000 },
      { id: '3', descripcion: 'Filtros de repuesto', cantidad: 10, precio_unitario: 25000 },
      { id: '4', descripcion: 'Gas refrigerante R410A', cantidad: 2, precio_unitario: 85000 }
    ]
  },
  {
    id: '2',
    fecha: '2026-04-05',
    total: 2800000,
    estado: 'pendiente',
    cliente_id: '3',
    descripcion: 'Reparación mayor de chiller',
    items: [
      { id: '1', descripcion: 'Diagnóstico y mano de obra', cantidad: 1, precio_unitario: 500000 },
      { id: '2', descripcion: 'Compresor scroll', cantidad: 1, precio_unitario: 1800000 },
      { id: '3', descripcion: 'Gas refrigerante R134a', cantidad: 5, precio_unitario: 100000 }
    ]
  },
  {
    id: '3',
    fecha: '2026-04-06',
    total: 580000,
    estado: 'pendiente',
    cliente_id: '4',
    descripcion: 'Servicio de instalación de filtros y limpieza',
    items: [
      { id: '1', descripcion: 'Filtros HEPA', cantidad: 4, precio_unitario: 95000 },
      { id: '2', descripcion: 'Servicio de instalación', cantidad: 1, precio_unitario: 200000 }
    ]
  }
]
