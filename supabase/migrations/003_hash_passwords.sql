-- ============================================================
-- Hash passwords for existing test users
-- ============================================================
-- 
-- Este archivo actualiza las contraseñas de los usuarios de prueba
-- a versiones hasheadas con bcryptjs (10 rounds)
--
-- Ejecutar en: SQL Editor de Supabase
-- ============================================================

-- Update password for admin user
UPDATE usuarios
SET password = '$2b$10$GH4.quD.ty6aBAWLhVtsGOyEwgnb3ASAXF/FBz91IMWRo8TxNHUVe'
WHERE email = 'admin@climatech.com';

-- Update password for tecnico user
UPDATE usuarios
SET password = '$2b$10$rKiIrtnAI1NpcgiPGUI9reKyMN2cf3./sBbfYzyVlstLvuU2HQ3j6'
WHERE email = 'tecnico@climatech.com';

-- Update password for cliente user
UPDATE usuarios
SET password = '$2b$10$D0mjuZ9iSqvh0pg3gBj23upGJwDymuLj6p3nBoX2Pup0kTqymleBK'
WHERE email = 'cliente@climatech.com';

-- Verify updates
SELECT email, password, rol FROM usuarios ORDER BY created_at;
