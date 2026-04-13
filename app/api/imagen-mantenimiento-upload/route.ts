import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mantenimientoId = formData.get('mantenimientoId') as string
    const descripcion = (formData.get('descripcion') as string) || ''

    if (!file || !mantenimientoId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              )
            } catch {
              // Ignorado
            }
          },
        },
      }
    )

    const fileExt = file.name.split('.').pop()
    const fileName = `${mantenimientoId}/${Date.now()}.${fileExt}`
    const buffer = await file.arrayBuffer()

    console.log('Subiendo imagen:', { fileName, fileSize: buffer.byteLength })

    // Subir archivo a Storage
    const { error: uploadError } = await supabase.storage
      .from('mantenimientos')
      .upload(fileName, new Uint8Array(buffer), { upsert: false })

    if (uploadError) {
      console.error('Error upload:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    console.log('Imagen subida exitosamente:', fileName)

    // Obtener URL pública
    const { data } = supabase.storage
      .from('mantenimientos')
      .getPublicUrl(fileName)

    // Guardar en BD
    const { data: dbRecord, error: dbError } = await supabase
      .from('mantenimiento_evidencia')
      .insert([{
        mantenimiento_id: mantenimientoId,
        imagen_url: data.publicUrl,
        nombre_archivo: file.name,
        descripcion: descripcion || null
      }])
      .select()
      .single()

    if (dbError) {
      console.warn('Advertencia guardando en BD:', dbError)
    }

    return NextResponse.json({
      id: dbRecord?.id || fileName,
      mantenimiento_id: mantenimientoId,
      imagen_url: data.publicUrl,
      nombre_archivo: file.name,
      descripcion: descripcion || '',
      created_at: dbRecord?.created_at || new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en API upload:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
