import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const cotizacionId = formData.get('cotizacionId') as string
    const descripcion = (formData.get('descripcion') as string) || ''
    const tipo = (formData.get('tipo') as string) || 'cotizacion' // 'cotizacion' o 'mantenimiento'

    if (!file || !cotizacionId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Crear cliente Supabase con Service Role Key para saltarse RLS
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
    const fileName = `${cotizacionId}/${Date.now()}.${fileExt}`
    const buffer = await file.arrayBuffer()

    console.log('Subiendo archivo:', { fileName, fileSize: buffer.byteLength, tipo })

    // Subir archivo con Service Role Key (saltando RLS)
    const { error: uploadError } = await supabase.storage
      .from('cotizaciones')
      .upload(fileName, new Uint8Array(buffer), { upsert: false })

    if (uploadError) {
      console.error('Error upload:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    console.log('Archivo subido exitosamente:', fileName)

    // Obtener URL pública
    const { data } = supabase.storage
      .from('cotizaciones')
      .getPublicUrl(fileName)

    // Guardar en BD solo si es tipo cotizacion
    if (tipo === 'cotizacion') {
      const { data: dbRecord, error: dbError } = await supabase
        .from('cotizacion_evidencia')
        .insert([{
          cotizacion_id: cotizacionId,
          archivo_url: data.publicUrl,
          nombre_archivo: file.name,
          descripcion: descripcion || null
        }])
        .select()
        .single()

      if (dbError) {
        console.warn('Advertencia guardando en BD:', dbError)
        // Continuar aunque falle la BD, el archivo está en Storage
      }

      return NextResponse.json({
        id: dbRecord?.id || fileName,
        cotizacion_id: cotizacionId,
        archivo_url: data.publicUrl,
        nombre_archivo: file.name,
        descripcion: descripcion || '',
        created_at: dbRecord?.created_at || new Date().toISOString()
      })
    }

    // Para mantenimientos, solo retornar la URL
    return NextResponse.json({
      archivo_url: data.publicUrl,
      nombre_archivo: file.name,
      descripcion: descripcion || ''
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en API upload:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
