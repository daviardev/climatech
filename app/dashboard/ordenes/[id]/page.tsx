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
  agregarRepuestoAMantenimiento,
  getMantenimientosByOrdenId,
  getRepuestos,
  getRepuestosDelMantenimiento,
  subirImagenMantenimiento,
  getImagenesMantenimiento,
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
  ImagenMantenimiento,
  RepuestoMantenimiento,
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
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null);
  const [evidenciaPreview, setEvidenciaPreview] = useState<string>("");
  const [isUploadingMantenimiento, setIsUploadingMantenimiento] =
    useState(false);
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState<
    Array<{
      repuestoId: string;
      cantidad: number;
    }>
  >([]);
  const [mantenimientoConRepuestos, setMantenimientoConRepuestos] = useState<
    Array<{
      id: string;
      repuestos: RepuestoMantenimiento[];
    }>
  >([]);
  const [imagenesMantenimiento, setImagenesMantenimiento] = useState<{
    [key: string]: ImagenMantenimiento[];
  }>({});
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedMantenimientoId, setSelectedMantenimientoId] = useState<
    string | null
  >(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] =
    useState<Mantenimiento | null>(null);

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

      // Cargar repuestos de cada mantenimiento
      if (mantenimientosData.length > 0) {
        const mantenimientosConRepuestos = await Promise.all(
          mantenimientosData.map(async (m) => ({
            id: m.id,
            repuestos: await getRepuestosDelMantenimiento(m.id),
          })),
        );
        setMantenimientoConRepuestos(mantenimientosConRepuestos);

        // Cargar imágenes de cada mantenimiento
        const imagenesMap: { [key: string]: ImagenMantenimiento[] } = {};
        for (const m of mantenimientosData) {
          imagenesMap[m.id] = await getImagenesMantenimiento(m.id);
        }
        setImagenesMantenimiento(imagenesMap);
      }
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

      // Si admin verifica y aprueba, generar reporte y notificación
      if (estado === "completada") {
        console.log("Orden completada");
      }

      await loadData();
    } catch (error) {
      console.error("Error updating estado:", error);
    }
  };

  const handleAddMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orden) return;
    try {
      setIsUploadingMantenimiento(true);

      // Subir imagen si existe
      let evidenciaUrl = "";
      if (evidenciaFile) {
        const formData = new FormData();
        formData.append("file", evidenciaFile);
        formData.append("cotizacionId", orden.id);
        formData.append("descripcion", "Evidencia de mantenimiento");
        formData.append("tipo", "mantenimiento");

        try {
          const response = await fetch("/api/evidencia-upload", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();
          console.log("Response from endpoint:", data);

          if (!response.ok) {
            throw new Error(
              data.error || `Error ${response.status}: subiendo imagen`,
            );
          }

          evidenciaUrl = data.archivo_url;
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }
      }

      const nuevoMantenimiento = await createMantenimiento({
        ...mantenimientoForm,
        orden_id: orden.id,
        fecha_realizacion: new Date().toISOString().split("T")[0],
        evidencia_url: evidenciaUrl || null,
      });

      // Agregar repuestos usados (solo si es correctivo)
      if (
        mantenimientoForm.tipo === "correctivo" &&
        repuestosSeleccionados.length > 0
      ) {
        for (const rep of repuestosSeleccionados) {
          if (rep.repuestoId && rep.cantidad > 0) {
            await agregarRepuestoAMantenimiento(
              nuevoMantenimiento.id,
              rep.repuestoId,
              rep.cantidad,
            );
          }
        }
      }

      await loadData();
      setIsMantenimientoDialogOpen(false);
      setMantenimientoForm({
        tipo: "preventivo",
        descripcion: "",
        evidencia_url: "",
      });
      setEvidenciaFile(null);
      setEvidenciaPreview("");
      setRepuestosSeleccionados([]);

      // Update orden status to en_progreso if it was asignada
      if (orden.estado === "asignada") {
        await handleUpdateEstado("en_progreso");
      }
    } catch (error) {
      console.error("Error creating mantenimiento:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Error al registrar mantenimiento";
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsUploadingMantenimiento(false);
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
                          <button
                            onClick={() => {
                              setSelectedMantenimiento(m);
                              setGalleryOpen(true);
                            }}
                            className="flex items-start gap-2 p-2 border rounded hover:bg-muted transition cursor-pointer">
                            <Image className="h-4 w-4 flex-shrink-0 mt-1" />
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm text-muted-foreground mb-2">
                                Evidencia:
                              </p>
                              <img
                                src={m.evidencia_url}
                                alt="Evidencia"
                                className="rounded-lg max-w-xs h-32 object-cover"
                              />
                            </div>
                          </button>
                        </div>
                      )}

                      {/* Mostrar imágenes adicionales del mantenimiento */}
                      {(imagenesMantenimiento[m.id]?.length ?? 0) > 0 && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Imágenes ({imagenesMantenimiento[m.id]?.length ?? 0}
                            )
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {imagenesMantenimiento[m.id]?.map(
                              (img: ImagenMantenimiento, idx) => (
                                <button
                                  key={img.id}
                                  onClick={() => {
                                    setSelectedMantenimientoId(m.id);
                                    setSelectedImageIndex(idx);
                                    setImageGalleryOpen(true);
                                  }}
                                  className="relative group cursor-pointer rounded-lg overflow-hidden">
                                  <img
                                    src={img.imagen_url}
                                    alt={`Imagen ${idx + 1}`}
                                    className="w-full h-24 object-cover group-hover:opacity-75 transition"
                                  />
                                  {img.descripcion && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-1">
                                      <p className="text-white text-xs text-center">
                                        {img.descripcion}
                                      </p>
                                    </div>
                                  )}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {/* Botón para agregar más imágenes al mantenimiento */}
                      {user?.rol === "tecnico" &&
                        orden.estado !== "completada" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 w-full"
                            onClick={() => {
                              setSelectedMantenimientoId(m.id);
                              // Aquí se abrirá un dialog para subir más imágenes
                            }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Imagen
                          </Button>
                        )}

                      {/* Mostrar repuestos si existen */}
                      {(mantenimientoConRepuestos.find((mr) => mr.id === m.id)
                        ?.repuestos?.length ?? 0) > 0 && (
                        <div className="mt-4 p-3 bg-muted rounded">
                          <p className="text-sm font-semibold mb-2">
                            Repuestos Utilizados:
                          </p>
                          <div className="space-y-1">
                            {mantenimientoConRepuestos
                              .find((mr) => mr.id === m.id)
                              ?.repuestos?.map((rep: RepuestoMantenimiento) => (
                                <div
                                  key={rep.id}
                                  className="text-sm flex justify-between">
                                  <span>
                                    {rep.repuestos?.nombre || "Sin nombre"}
                                  </span>
                                  <span className="text-muted-foreground">
                                    x{rep.cantidad}
                                  </span>
                                </div>
                              ))}
                          </div>
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
              {/* Admin: Asignar tecnico desde estado pendiente */}
              {user?.rol === "admin" && orden.estado === "pendiente" && (
                <>
                  <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => handleUpdateEstado("asignada")}>
                    <Wrench className="mr-2 h-4 w-4" />
                    Asignar a Técnico
                  </Button>
                  <Button
                    className="w-full bg-red-600 text-white hover:bg-red-700"
                    onClick={() => handleUpdateEstado("cancelada")}>
                    Cancelar Orden
                  </Button>
                </>
              )}

              {/* Tecnico: Iniciar trabajo desde estado asignada */}
              {user?.rol === "tecnico" && orden.estado === "asignada" && (
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleUpdateEstado("en_progreso")}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Iniciar Trabajo
                </Button>
              )}

              {/* Tecnico: Completar trabajo desde estado en_progreso */}
              {user?.rol === "tecnico" && orden.estado === "en_progreso" && (
                <Button
                  className="w-full bg-yellow-600 text-white hover:bg-yellow-700"
                  onClick={() => handleUpdateEstado("pending_verification")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completar Trabajo
                </Button>
              )}

              {/* Admin: Verificar trabajo pendiente */}
              {user?.rol === "admin" &&
                orden.estado === "pending_verification" && (
                  <>
                    <Button
                      className="w-full bg-green-600 text-white hover:bg-green-700"
                      onClick={() => handleUpdateEstado("completada")}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verificar y Aprobar
                    </Button>
                    <Button
                      className="w-full bg-orange-600 text-white hover:bg-orange-700"
                      onClick={() => handleUpdateEstado("en_progreso")}>
                      Rechazar - Volver a Trabajo
                    </Button>
                    <Button
                      className="w-full bg-red-600 text-white hover:bg-red-700"
                      onClick={() => handleUpdateEstado("cancelada")}>
                      Cancelar Orden
                    </Button>
                  </>
                )}

              {/* Estados finales */}
              {orden.estado === "completada" && (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-600">
                    Orden Verificada y Completada
                  </p>
                </div>
              )}

              {orden.estado === "cancelada" && (
                <div className="text-center py-4">
                  <p className="font-medium text-red-600">Orden Cancelada</p>
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
        onOpenChange={(open) => {
          if (!open) {
            setMantenimientoForm({
              tipo: "preventivo",
              descripcion: "",
              evidencia_url: "",
            });
            setEvidenciaFile(null);
            setEvidenciaPreview("");
            setRepuestosSeleccionados([]);
          }
          setIsMantenimientoDialogOpen(open);
        }}>
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
                <FieldLabel>Evidencia (Imagen) - Opcional</FieldLabel>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEvidenciaFile(file);
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setEvidenciaPreview(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    disabled={isUploadingMantenimiento}
                  />
                  {evidenciaPreview && (
                    <div className="relative inline-block rounded-lg overflow-hidden max-h-48">
                      <img
                        src={evidenciaPreview}
                        alt="Preview"
                        className="max-h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEvidenciaFile(null);
                          setEvidenciaPreview("");
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600">
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </Field>

              {/* Repuestos Section - Solo aparece si es correctivo */}
              {mantenimientoForm.tipo === "correctivo" && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-sm mb-3">
                    Repuestos Utilizados
                  </h4>

                  {/* Add Repuesto Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRepuestosSeleccionados([
                        ...repuestosSeleccionados,
                        { repuestoId: "", cantidad: 1 },
                      ]);
                    }}
                    className="mb-3 w-full">
                    + Agregar Repuesto
                  </Button>

                  {/* Repuestos List */}
                  <div className="space-y-3">
                    {repuestosSeleccionados.map((rep, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Select
                          value={rep.repuestoId}
                          onValueChange={(value) => {
                            const nuevos = [...repuestosSeleccionados];
                            nuevos[idx].repuestoId = value;
                            setRepuestosSeleccionados(nuevos);
                          }}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecciona un repuesto..." />
                          </SelectTrigger>
                          <SelectContent>
                            {repuestos.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.nombre} ({r.stock} disponibles)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="1"
                          value={rep.cantidad}
                          onChange={(e) => {
                            const nuevos = [...repuestosSeleccionados];
                            nuevos[idx].cantidad =
                              parseInt(e.target.value) || 1;
                            setRepuestosSeleccionados(nuevos);
                          }}
                          placeholder="Cantidad"
                          className="w-20"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setRepuestosSeleccionados(
                              repuestosSeleccionados.filter(
                                (_, i) => i !== idx,
                              ),
                            );
                          }}>
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMantenimientoDialogOpen(false)}
                disabled={isUploadingMantenimiento}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUploadingMantenimiento}>
                {isUploadingMantenimiento && (
                  <Spinner className="mr-2 h-4 w-4" />
                )}
                Guardar Registro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal para Mantenimientos */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Evidencia de Mantenimiento</DialogTitle>
          </DialogHeader>

          {selectedMantenimiento?.evidencia_url && (
            <div className="space-y-4">
              {/* Main Image */}
              <div className="flex justify-center bg-muted rounded-lg overflow-hidden max-h-96">
                <img
                  src={selectedMantenimiento.evidencia_url}
                  alt="Evidencia"
                  className="max-h-96 object-contain"
                />
              </div>

              {/* Image Info */}
              <div className="text-sm bg-muted p-3 rounded">
                <p className="font-medium">
                  Tipo: {selectedMantenimiento.tipo}
                </p>
                <p className="text-muted-foreground mt-1">
                  {selectedMantenimiento.descripcion}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setGalleryOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
