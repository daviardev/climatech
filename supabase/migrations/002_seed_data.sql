-- ============================================================
-- ClimaTech - Seed Data (Datos de Prueba)
-- ============================================================
-- 
-- Ejecutar DESPUÉS de que las tablas estén creadas
-- Este script solo inserta datos de prueba
-- ============================================================

-- ============ INSERTAR USUARIOS DE PRUEBA ============
-- Usuario ADMIN
INSERT INTO usuarios (nombre, email, password, rol)
VALUES (
  'Admin User',
  'admin@climatech.com',
  'admin123',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Usuario TÉCNICO
INSERT INTO usuarios (nombre, email, password, rol)
VALUES (
  'Carlos Técnico',
  'tecnico@climatech.com',
  'tecnico123',
  'tecnico'
) ON CONFLICT (email) DO NOTHING;

-- Usuario CLIENTE
INSERT INTO usuarios (nombre, email, password, rol)
VALUES (
  'Juan Cliente',
  'cliente@climatech.com',
  'cliente123',
  'cliente'
) ON CONFLICT (email) DO NOTHING;

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

-- ============ VERIFICACIÓN ============
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT COUNT(*) as total_clientes FROM clientes;
SELECT COUNT(*) as total_tecnicos FROM tecnicos;
SELECT COUNT(*) as total_equipos FROM equipos;
SELECT COUNT(*) as total_repuestos FROM repuestos;
