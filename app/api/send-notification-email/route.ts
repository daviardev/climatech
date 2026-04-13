import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Interfaces para las plantillas de email
interface EmailTemplate {
  subject: string
  html: string
  to: string[]
}

function generarPlantillaEmail(
  evento: string,
  descripcion: string,
  cambiosNuevos?: Record<string, unknown>
): EmailTemplate {
  const emailTemplates: Record<string, (desc: string, cambios?: Record<string, unknown>) => EmailTemplate> = {
    usuario_creado: (desc, cambios) => ({
      subject: '🎉 ¡Bienvenido a ClimateTech! Tus credenciales de acceso',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">¡Bienvenido a ClimateTech!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Hola ${cambios?.nombre || 'Usuario'},</p>
            <p style="color: #666; line-height: 1.6;">Tu cuenta ha sido creada exitosamente en nuestro sistema. A continuación encontrarás tus credenciales de acceso:</p>
            
            <div style="background-color: #f3f4f6; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 8px 0;"><strong style="color: #667eea;">Usuario (Email):</strong><br/><span style="font-family: 'Courier New', monospace; color: #333;">${cambios?.email || 'N/A'}</span></p>
              <p style="margin: 8px 0;"><strong style="color: #667eea;">Contraseña:</strong><br/><span style="font-family: 'Courier New', monospace; color: #333;">${cambios?.password || 'N/A'}</span></p>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña en el primer acceso.</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.APP_URL || 'https://climatech.local'}/auth/login" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Acceder a ClimateTech</a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              <strong>Tu Rol:</strong> ${cambios?.rol === 'admin' ? 'Administrador' : cambios?.rol === 'tecnico' ? 'Técnico' : 'Cliente'}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; line-height: 1.6;">
              Si tienes problemas para acceder o necesitas asistencia, contacta al equipo de soporte.<br/>
              Este es un correo automático, por favor no responder.
            </p>
          </div>
        </div>
      `,
      to: []
    }),
    
    orden_creada: (desc, cambios) => ({
      subject: '📋 Nueva orden de trabajo creada',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Nueva Orden de Trabajo</h2>
          <p>${desc || ''}</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Cliente:</strong> ${cambios?.cliente_nombre || 'N/A'}</p>
            <p><strong>Equipo:</strong> ${cambios?.equipo_tipo || 'N/A'}</p>
            <p><strong>Prioridad:</strong> <span style="color: #d32f2f;">${cambios?.prioridad || 'N/A'}</span></p>
          </div>
        </div>
      `,
      to: []
    }),

    orden_asignada: (desc, cambios) => ({
      subject: '👷 Orden de trabajo asignada a ti',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Orden Asignada</h2>
          <p>Se te ha asignado una nueva orden de trabajo.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Cliente:</strong> ${cambios?.cliente_nombre || 'N/A'}</p>
            <p><strong>Equipo:</strong> ${cambios?.equipo_tipo || 'N/A'}</p>
            <p><strong>Descripción:</strong> ${desc || 'N/A'}</p>
          </div>
          <a href="http://localhost:3000/dashboard/ordenes" style="display: inline-block; background-color: #1976d2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 20px;">Ver Orden</a>
        </div>
      `,
      to: []
    }),

    trabajo_completado: (desc, cambios) => ({
      subject: '✔️ Trabajo marcado como completado',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Trabajo Completado por Técnico</h2>
          <p>El técnico ha marcado el trabajo como completado y está pendiente de tu verificación.</p>
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>Orden:</strong> ${cambios?.orden_id || 'N/A'}</p>
            <p><strong>Descripción:</strong> ${desc || 'N/A'}</p>
          </div>
          <p>Por favor, revisa y verifica la orden en el panel de administración.</p>
          <a href="http://localhost:3000/dashboard/ordenes" style="display: inline-block; background-color: #1976d2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 20px;">Ir al Panel</a>
        </div>
      `,
      to: []
    }),

    trabajo_verificado: (desc, cambios) => ({
      subject: '✅ Trabajo verificado y completado',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Tu Orden ha sido Completada</h2>
          <p>El administrador ha verificado y aprobado el trabajo realizado en tu equipo.</p>
          <div style="background-color: #c8e6c9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p><strong>Equipo:</strong> ${cambios?.equipo_tipo || 'N/A'}</p>
            <p><strong>Descripción:</strong> ${desc || 'N/A'}</p>
          </div>
        </div>
      `,
      to: []
    }),

    cotizacion_creada: (desc, cambios) => ({
      subject: '📊 Nueva cotización disponible',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Cotización Disponible para Revisión</h2>
          <p>Se ha creado una nueva cotización para tu equipo.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Equipo:</strong> ${cambios?.equipo_tipo || 'N/A'}</p>
            <p><strong>Tipo de Trabajo:</strong> ${cambios?.tipo_trabajo || 'N/A'}</p>
          </div>
          <p>Por favor, revisa la cotización en tu panel.</p>
          <a href="http://localhost:3000/dashboard/mis-cotizaciones" style="display: inline-block; background-color: #1976d2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 20px;">Ver Cotización</a>
        </div>
      `,
      to: []
    }),

    cotizacion_completada: (desc, cambios) => ({
      subject: '📋 Cotización completada - Pendiente de tu aprobación',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Cotización Completada</h2>
          <p>La cotización ha sido completada por el administrador y requiere tu aprobación.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Total:</strong> <span style="font-size: 1.3em; color: #1976d2; font-weight: bold;">$${cambios?.total?.toLocaleString() || '0'}</span></p>
            <p><strong>Cantidad de Items:</strong> ${cambios?.cantidad_items || '0'}</p>
          </div>
          <p>Revisa y aprueba la cotización en tu panel.</p>
          <a href="http://localhost:3000/dashboard/mis-cotizaciones" style="display: inline-block; background-color: #4caf50; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 20px;">Aprobar Cotización</a>
        </div>
      `,
      to: []
    }),

    cotizacion_aprobada: (desc, cambios) => ({
      subject: '✅ Cotización aprobada por cliente',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Cotización Aprobada</h2>
          <p>El cliente ha aprobado la cotización.</p>
          <div style="background-color: #c8e6c9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p><strong>Total Aprobado:</strong> <span style="font-size: 1.2em; font-weight: bold;">$${cambios?.total?.toLocaleString() || '0'}</span></p>
            <p><strong>Cliente:</strong> ${cambios?.cliente_nombre || 'N/A'}</p>
          </div>
        </div>
      `,
      to: []
    }),

    cotizacion_rechazada: (desc, cambios) => ({
      subject: '❌ Cotización rechazada por cliente',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Cotización Rechazada</h2>
          <p>El cliente ha rechazado la cotización.</p>
          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
            <p><strong>Cliente:</strong> ${cambios?.cliente_nombre || 'N/A'}</p>
            <p><strong>Comentarios:</strong> ${desc || 'Sin comentarios'}</p>
          </div>
        </div>
      `,
      to: []
    })
  }

  const template = emailTemplates[evento]
  if (!template) {
    return {
      subject: `Evento: ${evento}`,
      html: `<div style="font-family: Arial, sans-serif;"><p>${descripcion || 'Evento registrado: ' + evento}</p></div>`,
      to: []
    }
  }

  return template(descripcion, cambiosNuevos)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      auditLogId,
      evento,
      descripcion,
      emailDestinatarios,
      cambiosNuevos
    } = body

    console.log('send-notification-email request', {
      evento,
      emailDestinatarios,
      hasResendKey: Boolean(process.env.RESEND_API_KEY),
      auditLogId
    })

    if (!emailDestinatarios || emailDestinatarios.length === 0) {
      return NextResponse.json(
        { error: 'No hay destinatarios de email' },
        { status: 400 }
      )
    }

    // Generar plantilla de email
    const template = generarPlantillaEmail(evento, descripcion, cambiosNuevos)
    template.to = emailDestinatarios

    // Usar Resend si está configurado
    if (process.env.RESEND_API_KEY) {
      // En modo testing de Resend, filtrar solo emails reales (no locales)
      const emailsValidos = emailDestinatarios.filter((email: string) => 
        email.includes('@') && !email.endsWith('.local')
      )

      console.log('emails válidos para Resend:', emailsValidos, 'filtrados:', emailDestinatarios.filter((e: string) => !emailsValidos.includes(e)))

      if (emailsValidos.length === 0) {
        console.warn('⚠️  No hay emails válidos para enviar en modo testing de Resend')
        
        // Registrar en audit log
        try {
          const supabase = await createClient()
          await supabase
            .from('audit_logs')
            .update({ email_enviado: false })
            .eq('id', auditLogId)
        } catch (dbError) {
          console.error('Error actualizando audit log:', dbError)
        }

        return NextResponse.json(
          {
            success: false,
            message: 'No hay emails válidos para enviar (Resend en modo testing)',
            evento,
            warning: 'Los emails locales (.local) no se pueden enviar en modo testing. Verifica un dominio en resend.com/domains'
          },
          { status: 400 }
        )
      }

      try {
        await resend.emails.send({
          from: 'ClimateTech <onboarding@resend.dev>',
          to: emailsValidos,
          subject: template.subject,
          html: template.html
        })

        // Actualizar audit log
        const supabase = await createClient()
        await supabase
          .from('audit_logs')
          .update({ 
            email_enviado: true,
            email_destinatarios: emailsValidos 
          })
          .eq('id', auditLogId)

        return NextResponse.json(
          {
            success: true,
            message: `Email enviado a ${emailsValidos.length} destinatario(s)`,
            evento,
            destinatarios: emailsValidos,
            filteredOut: emailDestinatarios.filter((e: string) => !emailsValidos.includes(e))
          },
          { status: 200 }
        )
      } catch (resendError) {
        console.error('Error con Resend:', resendError)
        
        // Registrar intento fallido en audit log
        try {
          const supabase = await createClient()
          await supabase
            .from('audit_logs')
            .update({ email_enviado: false })
            .eq('id', auditLogId)
        } catch (dbError) {
          console.error('Error actualizando audit log:', dbError)
        }
        
        return NextResponse.json(
          {
            success: false,
            message: 'Error enviando email',
            error: resendError instanceof Error ? resendError.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
    } else {
      // Modo de desarrollo: solo registrar
      console.warn('⚠️ RESEND_API_KEY no configurada. Email en modo simulación.')
      
      try {
        const supabase = await createClient()
        await supabase
          .from('audit_logs')
          .update({ email_enviado: true })
          .eq('id', auditLogId)
      } catch (dbError) {
        console.error('Error actualizando audit log:', dbError)
      }

      return NextResponse.json(
        {
          success: true,
          message: `[SIMULACIÓN] Email enviado a ${emailDestinatarios.length} destinatarios`,
          evento,
          destinatarios: emailDestinatarios,
          warning: 'RESEND_API_KEY no configurada - emails en modo simulación'
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Error en send-notification-email:', error)
    return NextResponse.json(
      { error: 'Error enviando notificación' },
      { status: 500 }
    )
  }
}
