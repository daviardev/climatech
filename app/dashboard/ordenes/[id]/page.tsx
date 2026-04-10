"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOrdenById,
  updateOrden,
  createMantenimiento,
  getMantenimientosByOrdenId,
  getRepuestos,
  formatDate,
  getEstadoColor,
  getPrioridadColor,
} from "@/lib/api";
import type {
  OrdenTrabajoExtendida,
  Mantenimiento,
  Repuesto,
  TipoMantenimiento,
  EstadoOrden,
} from "@/lib/types";
import {
  ArrowLeft,
  Building2,
  User,
  Thermometer,
  Calendar,
  MapPin,
  Phone,
  Wrench,
  Plus,
  CheckCircle2,
  Image,
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function OrdenDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [orden, setOrden] = useState<OrdenTrabajoExtendida | null>(null);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMantenimientoDialogOpen, setIsMantenimientoDialogOpen] =
    useState(false);

  // Mantenimiento form
  const [mantenimientoForm, setMantenimientoForm] = useState({
    tipo: "preventivo" as TipoMantenimiento,
    descripcion: "",
    evidencia_url: "",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [ordenData, mantenimientosData, repuestosData] = await Promise.all([
        getOrdenById(id as string),
        getMantenimientosByOrdenId(id as string),
        getRepuestos(),
      ]);
      setOrden(ordenData);
      setMantenimientos(mantenimientosData);
      setRepuestos(repuestosData);
    } catch (error) {
      console.error("Error loading orden:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleUpdateEstado = async (estado: EstadoOrden) => {
    if (!orden) return;
    try {
      await updateOrden(orden.id, { estado });
      await loadData();
    } catch (error) {
      console.error("Error updating estado:", error);
    }
  };

  const handleAddMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orden) return;
    try {
      await createMantenimiento({
        ...mantenimientoForm,
        orden_id: orden.id,
        fecha_realizacion: new Date().toISOString().split("T")[0],
        evidencia_url: mantenimientoForm.evidencia_url || null,
      });
      await loadData();
      setIsMantenimientoDialogOpen(false);
      setMantenimientoForm({
        tipo: "preventivo",
        descripcion: "",
        evidencia_url: "",
      });

      // Update orden status to en_progreso if it was asignada
      if (orden.estado === "asignada") {
        await handleUpdateEstado("en_progreso");
      }
    } catch (error) {
      console.error("Error creating mantenimiento:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Orden no encontrada</p>
        <Link href="/dashboard/ordenes">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Órdenes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ordenes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            Orden #{orden.id}
          </h1>
          <p className="text-muted-foreground">{orden.descripcion}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getEstadoColor(orden.estado)}>
            {orden.estado.replace("_", " ")}
          </Badge>
          <Badge
            variant="outline"
            className={getPrioridadColor(orden.prioridad)}>
            Prioridad: {orden.prioridad}
          </Badge>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{orden.cliente?.nombre}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Técnico Asignado
                    </p>
                    <p className="font-medium">
                      {orden.tecnico?.nombre || "Sin asignar"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Thermometer className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Equipo</p>
                    <p className="font-medium">{orden.equipo?.tipo}</p>
                    <p className="text-sm text-muted-foreground">
                      {orden.equipo?.marca} {orden.equipo?.modelo}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Fecha de Creación
                    </p>
                    <p className="font-medium">{formatDate(orden.fecha)}</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{orden.cliente?.direccion}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{orden.cliente?.telefono}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mantenimientos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Registro de Mantenimiento
                </CardTitle>
                <CardDescription>
                  Historial de trabajos realizados
                </CardDescription>
              </div>
              {user?.rol === "tecnico" && orden.estado !== "completada" && (
                <Button
                  size="sm"
                  onClick={() => setIsMantenimientoDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Trabajo
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {mantenimientos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay registros de mantenimiento
                </p>
              ) : (
                <div className="space-y-4">
                  {mantenimientos.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant="outline"
                          className={
                            m.tipo === "preventivo"
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-warning/10 text-warning-foreground border-warning/30"
                          }>
                          {m.tipo}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(m.fecha_realizacion)}
                        </span>
                      </div>
                      <p className="text-foreground">{m.descripcion}</p>
                      {m.evidencia_url && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                            <Image className="h-4 w-4" />
                            Evidencia:
                          </p>
                          <img
                            src={m.evidencia_url}
                            alt="Evidencia del mantenimiento"
                            className="rounded-lg max-w-xs h-32 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user?.rol === "tecnico" && orden.estado === "asignada" && (
                <Button
                  className="w-full"
                  onClick={() => handleUpdateEstado("en_progreso")}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Iniciar Trabajo
                </Button>
              )}
              {user?.rol === "tecnico" && orden.estado === "en_progreso" && (
                <Button
                  className="w-full bg-success hover:bg-success/90"
                  onClick={() => handleUpdateEstado("completada")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar Servicio Completado
                </Button>
              )}
              {user?.rol === "admin" && orden.estado !== "completada" && (
                <>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleUpdateEstado("completada")}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcar como Completada
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleUpdateEstado("cancelada")}>
                    Cancelar Orden
                  </Button>
                </>
              )}
              {orden.estado === "completada" && (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-2" />
                  <p className="font-medium text-success">Orden Completada</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repuestos Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Repuestos Disponibles</CardTitle>
              <CardDescription>Materiales en inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {repuestos.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.nombre}</span>
                    <Badge
                      variant="outline"
                      className={r.stock < 10 ? "text-warning" : ""}>
                      {r.stock} uds
                    </Badge>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/repuestos">
                <Button variant="link" className="p-0 h-auto mt-3">
                  Ver todo el inventario
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mantenimiento Dialog */}
      <Dialog
        open={isMantenimientoDialogOpen}
        onOpenChange={setIsMantenimientoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Trabajo de Mantenimiento</DialogTitle>
            <DialogDescription>
              Documenta el trabajo realizado en esta orden
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMantenimiento}>
            <FieldGroup>
              <Field>
                <FieldLabel>Tipo de Mantenimiento</FieldLabel>
                <Select
                  value={mantenimientoForm.tipo}
                  onValueChange={(value: TipoMantenimiento) =>
                    setMantenimientoForm({ ...mantenimientoForm, tipo: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventivo">Preventivo</SelectItem>
                    <SelectItem value="correctivo">Correctivo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Descripción del Trabajo</FieldLabel>
                <Textarea
                  value={mantenimientoForm.descripcion}
                  onChange={(e) =>
                    setMantenimientoForm({
                      ...mantenimientoForm,
                      descripcion: e.target.value,
                    })
                  }
                  placeholder="Describe el trabajo realizado, hallazgos, recomendaciones..."
                  required
                />
              </Field>
              <Field>
                <FieldLabel>URL de Evidencia (Opcional)</FieldLabel>
                <Input
                  value={mantenimientoForm.evidencia_url}
                  onChange={(e) =>
                    setMantenimientoForm({
                      ...mantenimientoForm,
                      evidencia_url: e.target.value,
                    })
                  }
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMantenimientoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Registro</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
