"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import {
  getClienteByUsuarioId,
  getEquiposByClienteId,
  getTiposTrabajo,
  crearSolicitudCotizacion,
} from "@/lib/api";

export default function SolicitarCotizacionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cliente, setCliente] = useState<any>(null);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [tiposTrabajo, setTiposTrabajo] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    equipoId: "",
    tipoTrabajoId: "",
    descripcion: "",
  });
  const [formError, setFormError] = useState("");

  // Protección: solo cliente
  useEffect(() => {
    if (user && user.rol !== "cliente") {
      router.push("/dashboard");
    } else if (user) {
      loadData();
    }
  }, [user, router]);

  async function loadData() {
    try {
      if (!user?.id) return;

      const [clienteData, tiposData] = await Promise.all([
        getClienteByUsuarioId(user.id),
        getTiposTrabajo(),
      ]);

      setCliente(clienteData);
      setTiposTrabajo(tiposData);

      // Cargar equipos del cliente
      if (clienteData?.id) {
        const equiposData = await getEquiposByClienteId(clienteData.id);
        setEquipos(equiposData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setFormError("Error cargando datos");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError("");

    // Validación
    if (!formData.equipoId.trim()) {
      setFormError("Selecciona un equipo");
      return;
    }
    if (!formData.tipoTrabajoId.trim()) {
      setFormError("Selecciona tipo de trabajo");
      return;
    }

    if (!cliente?.id) {
      setFormError("No se pudo identificar el cliente");
      return;
    }

    setIsSaving(true);
    try {
      const cotizacion = await crearSolicitudCotizacion(
        cliente.id,
        formData.equipoId,
        formData.tipoTrabajoId,
        formData.descripcion,
      );

      // Limpiar y redirigir
      setFormData({ equipoId: "", tipoTrabajoId: "", descripcion: "" });
      router.push("/dashboard/mis-cotizaciones");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : String(error) || "Error desconocido";
      console.error("Error completo:", error);
      setFormError(`Error: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No se encontró información de cliente asociada a tu usuario.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Volver al Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Solicitar Cotización
        </h1>
        <p className="text-muted-foreground">
          Selecciona el equipo y el tipo de trabajo que necesitas
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Solicitud</CardTitle>
          <CardDescription>
            Empresa: {cliente.nombre_empresa || cliente.nombre}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {formError}
              </div>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="equipo">Equipo *</FieldLabel>
                <Select
                  value={formData.equipoId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, equipoId: value })
                  }
                  disabled={isSaving}>
                  <SelectTrigger id="equipo">
                    <SelectValue placeholder="Selecciona un equipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipos.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No hay equipos registrados
                      </SelectItem>
                    ) : (
                      equipos.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.modelo}
                          {eq.serie && ` (${eq.serie})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  {equipos.length === 0 && (
                    <>
                      No tienes equipos registrados. Contacta al administrador
                      para agregar tus equipos.
                    </>
                  )}
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="tipoTrabajo">Tipo de Trabajo *</FieldLabel>
                <Select
                  value={formData.tipoTrabajoId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipoTrabajoId: value })
                  }
                  disabled={isSaving}>
                  <SelectTrigger id="tipoTrabajo">
                    <SelectValue placeholder="Selecciona tipo de trabajo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposTrabajo.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="descripcion">
                  Descripción (Opcional)
                </FieldLabel>
                <Textarea
                  id="descripcion"
                  placeholder="Describe el problema, síntomas o lo que necesitas..."
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  disabled={isSaving}
                  className="min-h-24"
                />
              </Field>
            </FieldGroup>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Spinner className="mr-2 h-4 w-4" />}
                Solicitar Cotización
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
