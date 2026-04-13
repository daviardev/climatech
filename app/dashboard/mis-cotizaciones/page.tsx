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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  getClienteByUsuarioId,
  getCotizacionesByClienteId,
  getCotizacionCompleta,
  cambiarEstadoCotizacion,
  getEvidenciaCotizacion,
  formatCurrency,
  formatDate,
  getEstadoColor,
} from "@/lib/api";
import { Eye, Image, Check, X } from "lucide-react";

export default function MisCotizacionesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cotizaciones, setCotizaciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog para ver detalles
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);

  // Galería de imágenes
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Dialog para aprobar/rechazar
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"aprobada" | "rechazada">(
    "aprobada",
  );
  const [comentarios, setComentarios] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Protección: solo cliente
  useEffect(() => {
    if (user && user.rol !== "cliente") {
      router.push("/dashboard");
    } else if (user) {
      loadCotizaciones();
    }
  }, [user, router]);

  async function loadCotizaciones() {
    try {
      if (!user?.id) return;

      const cliente = await getClienteByUsuarioId(user.id);
      if (cliente?.id) {
        const cotizacionesData = await getCotizacionesByClienteId(cliente.id);
        setCotizaciones(cotizacionesData);
      }
    } catch (error) {
      console.error("Error loading cotizaciones:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleViewDetails = async (cotizacion: Record<string, unknown>) => {
    try {
      const completa = await getCotizacionCompleta((cotizacion as any).id);
      const evidencia = await getEvidenciaCotizacion((cotizacion as any).id);
      setSelectedCotizacion(completa);
      setEvidenceList(evidencia);
      setDetailDialog(true);
    } catch (error) {
      console.error("Error loading details:", error);
    }
  };

  const handleOpenActionDialog = (tipo: "aprobada" | "rechazada") => {
    setActionType(tipo);
    setComentarios("");
    setActionDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedCotizacion?.id) return;

    setIsSaving(true);
    try {
      await cambiarEstadoCotizacion(
        selectedCotizacion.id,
        actionType,
        comentarios,
      );

      setActionDialog(false);
      setDetailDialog(false);
      setSelectedCotizacion(null);
      setComentarios("");

      // Recargar
      await loadCotizaciones();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar cotización");
    } finally {
      setIsSaving(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badgeClass = getEstadoColor(estado);
    const labels: Record<string, string> = {
      pendiente: "Pendiente",
      completada: "Completada",
      aprobada: "Aprobada",
      rechazada: "Rechazada",
    };

    return <Badge className={badgeClass}>{labels[estado] || estado}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis Cotizaciones</h1>
        <p className="text-muted-foreground">
          Revisa y aprueba las cotizaciones de tus solicitudes
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => router.push("/dashboard/solicitar-cotizacion")}>
          + Nueva Solicitud
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Cotizaciones</CardTitle>
          <CardDescription>
            {cotizaciones.length} cotización
            {cotizaciones.length !== 1 ? "es" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cotizaciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tienes cotizaciones aún</p>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/solicitar-cotizacion")}
                className="mt-4">
                Solicitar Cotización
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Tipo Trabajo</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizaciones.map((cot) => (
                    <TableRow key={cot.id}>
                      <TableCell className="font-medium">
                        {cot.equipos?.modelo} ({cot.equipos?.serie})
                      </TableCell>
                      <TableCell>{cot.tipos_trabajo?.nombre}</TableCell>
                      <TableCell className="text-right">
                        {cot.total > 0
                          ? formatCurrency(cot.total)
                          : "Por completar"}
                      </TableCell>
                      <TableCell>{getEstadoBadge(cot.estado)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(cot.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(cot)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Cotización</DialogTitle>
          </DialogHeader>

          {selectedCotizacion && (
            <div className="space-y-6">
              {/* Infomación Principal */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="grid gap-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground">Equipo</p>
                        <p className="font-medium">
                          {selectedCotizacion.equipos?.modelo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCotizacion.equipos?.serie}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tipo Trabajo</p>
                        <p className="font-medium">
                          {selectedCotizacion.tipos_trabajo?.nombre}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Descripción */}
              {selectedCotizacion.descripcion && (
                <div>
                  <p className="font-medium text-sm mb-2">Descripción</p>
                  <div className="p-3 bg-muted rounded text-sm whitespace-pre-wrap">
                    {selectedCotizacion.descripcion}
                  </div>
                </div>
              )}

              {/* Items */}
              {selectedCotizacion.cotizacion_items &&
                selectedCotizacion.cotizacion_items.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-2">Detalles</p>
                    <div className="space-y-2">
                      {selectedCotizacion.cotizacion_items.map(
                        (item: Record<string, unknown>, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-start p-3 border rounded">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {(item as any).descripcion}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(item as any).cantidad} x{" "}
                                {formatCurrency((item as any).precio_unitario)}
                              </p>
                            </div>
                            <p className="font-medium text-sm">
                              {formatCurrency(
                                (item as any).cantidad *
                                  (item as any).precio_unitario,
                              )}
                            </p>
                          </div>
                        ),
                      )}
                      <div className="flex justify-between items-center p-3 border-t-2 border-foreground/20 font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(selectedCotizacion.total)}</span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Evidencia */}
              {evidenceList.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-2">Evidencia</p>
                  <div className="grid grid-cols-2 gap-3">
                    {evidenceList.map((ev, idx) => (
                      <button
                        key={ev.id}
                        onClick={() => {
                          setSelectedImageIndex(idx);
                          setGalleryOpen(true);
                        }}
                        className="flex items-center gap-2 p-2 border rounded hover:bg-muted transition text-left">
                        <Image className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate font-medium">
                            {ev.nombre_archivo}
                          </p>
                          {ev.descripcion && (
                            <p className="text-xs text-muted-foreground truncate">
                              {ev.descripcion}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Estado:</p>
                <p>{getEstadoBadge(selectedCotizacion.estado)}</p>
              </div>

              {/* Actions - Solo si está completada */}
              {selectedCotizacion.estado === "completada" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => handleOpenActionDialog("rechazada")}
                    className="flex-1">
                    <X className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                  <Button
                    onClick={() => handleOpenActionDialog("aprobada")}
                    className="flex-1">
                    <Check className="mr-2 h-4 w-4" />
                    Aprobar
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialog(false)}
              disabled={isSaving}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "aprobada" ? "Aprobar" : "Rechazar"} Cotización
            </DialogTitle>
            <DialogDescription>
              {actionType === "aprobada"
                ? "¿Estás seguro de que deseas aprobar esta cotización?"
                : "¿Estás seguro de que deseas rechazar esta cotización?"}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Comentarios (opcional)..."
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            className="min-h-20"
            disabled={isSaving}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(false)}
              disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              variant={actionType === "aprobada" ? "default" : "destructive"}
              onClick={handleConfirmAction}
              disabled={isSaving}>
              {isSaving && <Spinner className="mr-2 h-4 w-4" />}
              {actionType === "aprobada" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Galería de Evidencia</DialogTitle>
          </DialogHeader>

          {evidenceList.length > 0 && (
            <div className="space-y-4">
              {/* Main Image */}
              <div className="flex justify-center bg-muted rounded-lg overflow-hidden max-h-96">
                <img
                  src={evidenceList[selectedImageIndex].archivo_url}
                  alt={evidenceList[selectedImageIndex].nombre_archivo}
                  className="max-h-96 object-contain"
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedImageIndex((prev) =>
                      prev === 0 ? evidenceList.length - 1 : prev - 1,
                    )
                  }>
                  ← Anterior
                </Button>

                <span className="text-sm text-muted-foreground">
                  {selectedImageIndex + 1} / {evidenceList.length}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedImageIndex((prev) =>
                      prev === evidenceList.length - 1 ? 0 : prev + 1,
                    )
                  }>
                  Siguiente →
                </Button>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {evidenceList.map((ev, idx) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition ${
                      selectedImageIndex === idx
                        ? "border-primary"
                        : "border-muted hover:border-muted-foreground"
                    }`}>
                    <img
                      src={ev.archivo_url}
                      alt={ev.nombre_archivo}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Image Info */}
              <div className="text-sm bg-muted p-3 rounded">
                <p className="font-medium">
                  {evidenceList[selectedImageIndex].nombre_archivo}
                </p>
                {evidenceList[selectedImageIndex].descripcion && (
                  <p className="text-muted-foreground">
                    {evidenceList[selectedImageIndex].descripcion}
                  </p>
                )}
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
