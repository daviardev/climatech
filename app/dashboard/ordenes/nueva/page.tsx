"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getClienteByUsuarioId,
  getEquiposByClienteId,
  createOrden,
} from "@/lib/api";
import type { Cliente, Equipo } from "@/lib/types";
import { ArrowLeft, Thermometer, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function NuevaOrdenPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    equipo_id: "",
    descripcion: "",
    prioridad: "media" as "baja" | "media" | "alta",
  });

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user || user.rol !== "cliente") {
      router.push("/dashboard");
      return;
    }

    try {
      const clienteData = await getClienteByUsuarioId(user.id);
      if (clienteData) {
        setCliente(clienteData);
        const equiposData = await getEquiposByClienteId(clienteData.id);
        setEquipos(equiposData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    setIsSubmitting(true);
    try {
      await createOrden({
        fecha: new Date().toISOString().split("T")[0],
        estado: "pendiente",
        cliente_id: cliente.id,
        tecnico_id: null,
        equipo_id: formData.equipo_id,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error creating orden:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center">
          <CardContent className="pt-12 pb-12">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Solicitud Enviada
            </h2>
            <p className="text-muted-foreground mb-6">
              Tu solicitud de servicio ha sido registrada exitosamente. Un
              técnico será asignado pronto.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard">
                <Button variant="outline">Volver al Inicio</Button>
              </Link>
              <Link href="/dashboard/ordenes">
                <Button>Ver Mis Órdenes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Solicitar Servicio
          </h1>
          <p className="text-muted-foreground">
            Solicita mantenimiento para tus equipos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Solicitud de Servicio</CardTitle>
          <CardDescription>
            Completa el formulario para solicitar un servicio de mantenimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel>Selecciona el Equipo</FieldLabel>
                {equipos.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    No tienes equipos registrados. Contacta al administrador.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {equipos.map((equipo) => (
                      <label
                        key={equipo.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                          formData.equipo_id === equipo.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}>
                        <input
                          type="radio"
                          name="equipo"
                          value={equipo.id}
                          checked={formData.equipo_id === equipo.id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              equipo_id: e.target.value,
                            })
                          }
                          className="sr-only"
                        />
                        <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Thermometer className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {equipo.tipo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {equipo.marca} - {equipo.modelo}
                          </p>
                          {equipo.numero_serie && (
                            <p className="text-xs text-muted-foreground">
                              S/N: {equipo.numero_serie}
                            </p>
                          )}
                        </div>
                        {formData.equipo_id === equipo.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="descripcion">
                  Descripción del Problema o Servicio
                </FieldLabel>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  placeholder="Describe el problema que presenta el equipo o el tipo de servicio que necesitas (ej: limpieza, revisión, reparación)..."
                  rows={4}
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Nivel de Urgencia</FieldLabel>
                <Select
                  value={formData.prioridad}
                  onValueChange={(value: "baja" | "media" | "alta") =>
                    setFormData({ ...formData, prioridad: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                        Baja - Mantenimiento preventivo o no urgente
                      </div>
                    </SelectItem>
                    <SelectItem value="media">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-warning" />
                        Media - Funciona pero presenta problemas
                      </div>
                    </SelectItem>
                    <SelectItem value="alta">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-destructive" />
                        Alta - No funciona o es urgente
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <div className="mt-6 flex gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  !formData.equipo_id || !formData.descripcion || isSubmitting
                }>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Solicitud
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">¿Qué sucede después?</h3>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>
              Tu solicitud será revisada por nuestro equipo administrativo
            </li>
            <li>
              Se asignará un técnico especializado según el tipo de equipo
            </li>
            <li>
              Recibirás una cotización si se requieren repuestos o trabajos
              adicionales
            </li>
            <li>El técnico coordinará la visita para realizar el servicio</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
