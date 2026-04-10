#!/bin/bash

# Script de configuración de Supabase para ClimaTech

echo "======================================"
echo "  Configuración de Supabase ClimaTech"
echo "======================================"
echo ""

# Verificar que se proporcionó la URL de Supabase
if [ -z "$SUPABASE_URL" ]; then
  echo "❌ Error: Falta la variable SUPABASE_URL"
  echo ""
  echo "Instrucciones:"
  echo "1. Ve a https://supabase.com"
  echo "2. Crea un proyecto nuevo"
  echo "3. Copia tu URL y clave anónima"
  echo "4. Crea el archivo .env.local con:"
  echo "   NEXT_PUBLIC_SUPABASE_URL=tu_url"
  echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave"
  exit 1
fi

echo "✅ Variables de entorno configuradas"
echo ""
echo "======================================"
echo "  PRÓXIMOS PASOS:"
echo "======================================"
echo ""
echo "1. Abre el archivo SUPABASE_SETUP.md"
echo "2. Sigue las instrucciones para:"
echo "   - Ir a SQL Editor en Supabase"
echo "   - Copiar el contenido de supabase/migrations/001_init.sql"
echo "   - Ejecutar el script SQL"
echo ""
echo "3. Usuarios de prueba que se crearán:"
echo "   - Admin: admin@climatech.com / admin123"
echo "   - Técnico: tecnico@climatech.com / tecnico123"
echo "   - Cliente: cliente@climatech.com / cliente123"
echo ""
echo "4. Ejecuta la aplicación:"
echo "   pnpm dev"
echo ""
echo "5. Intenta iniciar sesión en http://localhost:3000"
echo ""
