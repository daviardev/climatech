-- ============================================================
-- ClimaTech Database Setup - Supabase
-- ============================================================
-- 
-- IMPORTANTE: Este script crea toda la estructura de BD
-- desde cero. Los DROP TABLE eliminarán datos existentes.
--
-- Ejecutar en: SQL Editor de Supabase
-- ============================================================

-- ============ TABLA USUARIOS ============
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'tecnico', 'cliente')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLA CLIENTES ============
DROP TABLE IF EXISTS clientes CASCADE;

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  direccion TEXT,
  usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLA TÉCNICOS ============
DROP TABLE IF EXISTS tecnicos CASCADE;

CREATE TABLE tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  especialidad VARCHAR(255),
  usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLA EQUIPOS ============
DROP TABLE IF EXISTS equipos CASCADE;

CREATE TABLE equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(255) NOT NULL,
  marca VARCHAR(255),
  modelo VARCHAR(255),
  numero_serie VARCHAR(255),
  fecha_instalacion DATE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLA ÓRDENES DE TRABAJO ============
DROP TABLE IF EXISTS ordenes_trabajo CASCADE;

CREATE TABLE ordenes_trabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'asignada', 'en_progreso', 'completada', 'cancelada')),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tecnico_id UUID REFERENCES tecnicos(id) ON DELETE SET NULL,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  descripcion TEXT,
  prioridad VARCHAR(50) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLA MANTENIMIENTOS ============
DROP TABLE IF EXISTS mantenimientos CASCADE;

CREATE TABLE mantenimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('preventivo', 'correctivo')),
  descripcion TEXT NOT NULL,
  evidencia_url TEXT,
  orden_id UUID NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  fecha_realizacion DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLA REPUESTOS ============
DROP TABLE IF EXISTS repuestos CASCADE;

CREATE TABLE repuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  costo DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLA DETALLE REPUESTOS ============
DROP TABLE IF EXISTS detalle_repuestos CASCADE;

CREATE TABLE detalle_repuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mantenimiento_id UUID NOT NULL REFERENCES mantenimientos(id) ON DELETE CASCADE,
  repuesto_id UUID NOT NULL REFERENCES repuestos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mantenimiento_id, repuesto_id)
);

-- ============ TABLA COTIZACIONES ============
DROP TABLE IF EXISTS cotizaciones CASCADE;

CREATE TABLE cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ TABLA COTIZACION ITEMS ============
DROP TABLE IF EXISTS cotizacion_items CASCADE;

CREATE TABLE cotizacion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ÍNDICES PARA OPTIMIZACIÓN ============
DROP INDEX IF EXISTS idx_usuarios_email;
DROP INDEX IF EXISTS idx_usuarios_rol;
DROP INDEX IF EXISTS idx_clientes_usuario_id;
DROP INDEX IF EXISTS idx_tecnicos_usuario_id;
DROP INDEX IF EXISTS idx_equipos_cliente_id;
DROP INDEX IF EXISTS idx_ordenes_cliente_id;
DROP INDEX IF EXISTS idx_ordenes_tecnico_id;
DROP INDEX IF EXISTS idx_ordenes_equipo_id;
DROP INDEX IF EXISTS idx_ordenes_estado;
DROP INDEX IF EXISTS idx_mantenimientos_orden_id;
DROP INDEX IF EXISTS idx_detalle_repuestos_mantenimiento_id;
DROP INDEX IF EXISTS idx_cotizaciones_cliente_id;

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX idx_tecnicos_usuario_id ON tecnicos(usuario_id);
CREATE INDEX idx_equipos_cliente_id ON equipos(cliente_id);
CREATE INDEX idx_ordenes_cliente_id ON ordenes_trabajo(cliente_id);
CREATE INDEX idx_ordenes_tecnico_id ON ordenes_trabajo(tecnico_id);
CREATE INDEX idx_ordenes_equipo_id ON ordenes_trabajo(equipo_id);
CREATE INDEX idx_ordenes_estado ON ordenes_trabajo(estado);
CREATE INDEX idx_mantenimientos_orden_id ON mantenimientos(orden_id);
CREATE INDEX idx_detalle_repuestos_mantenimiento_id ON detalle_repuestos(mantenimiento_id);
CREATE INDEX idx_cotizaciones_cliente_id ON cotizaciones(cliente_id);

-- ============ INSERTAR USUARIOS DE PRUEBA ============
-- Usuario ADMIN
INSERT INTO usuarios (nombre, email, password, rol)
VALUES (
  'Admin User',
  'admin@climatech.com',
  'admin123',
  'admin'
) ON CONFLICT DO NOTHING;

-- Usuario TÉCNICO
INSERT INTO usuarios (nombre, email, password, rol)
VALUES (
  'Carlos Técnico',
  'tecnico@climatech.com',
  'tecnico123',
  'tecnico'
) ON CONFLICT DO NOTHING;

-- Usuario CLIENTE
INSERT INTO usuarios (nombre, email, password, rol)
VALUES (
  'Juan Cliente',
  'cliente@climatech.com',
  'cliente123',
  'cliente'
) ON CONFLICT DO NOTHING;

-- ============ INSERTAR CLIENTE DE PRUEBA ============
INSERT INTO clientes (nombre, telefono, direccion, usuario_id)
SELECT 
  'Empresa Refrigeración SA',
  '3105551234',
  'Calle 45 #12-34, Bogotá',
  id
FROM usuarios
WHERE email = 'cliente@climatech.com'
ON CONFLICT DO NOTHING;

-- ============ INSERTAR TÉCNICO DE PRUEBA ============
INSERT INTO tecnicos (nombre, especialidad, usuario_id, disponible)
SELECT 
  'Carlos Técnico',
  'Refrigeración Industrial',
  id,
  true
FROM usuarios
WHERE email = 'tecnico@climatech.com'
ON CONFLICT DO NOTHING;

-- ============ INSERTAR EQUIPO DE PRUEBA ============
INSERT INTO equipos (tipo, marca, modelo, numero_serie, cliente_id)
SELECT 
  'Aire Acondicionado',
  'Carrier',
  '50XCT048',
  'SN-2024-001',
  id
FROM clientes
WHERE nombre = 'Empresa Refrigeración SA'
ON CONFLICT DO NOTHING;

-- ============ INSERTAR REPUESTO DE PRUEBA ============
INSERT INTO repuestos (nombre, costo, stock)
VALUES 
  ('Compresor', 450000.00, 5),
  ('Filtro de aire', 25000.00, 15),
  ('Evaporador', 180000.00, 3),
  ('Condensador', 220000.00, 4),
  ('Válvula de expansión', 65000.00, 10)
ON CONFLICT DO NOTHING;
