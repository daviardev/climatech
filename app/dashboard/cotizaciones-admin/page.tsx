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
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  getCotizacionesByEstado,
  getCotizacionCompleta,
  completarCotizacion,
  crearCotizacionItem,
  actualizarCotizacionItem,
  eliminarCotizacionItem,
  subirEvidenciaCotizacion,
  getEvidenciaCotizacion,
  exportarCotizacionPDF,
  formatCurrency,
  formatDate,
  getRepuestos,
} from "@/lib/api";
import type {
  Repuesto,
  CotizacionConRelaciones,
  EvidenciaCotizacion,
} from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CotizacionItem } from "@/lib/types";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Edit, MoreHorizontal, Upload, FileText } from "lucide-react";

export default function CotizacionesAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cotizaciones, setCotizaciones] = useState<CotizacionConRelaciones[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  // Dialog para editar
  const [editDialog, setEditDialog] = useState(false);
  const [editingCotizacion, setEditingCotizacion] =
    useState<CotizacionConRelaciones | null>(null);
  const [editFormData, setEditFormData] = useState({
    descripcion: "",
    total: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Dialog para evidencia
  const [evidenceDialog, setEvidenceDialog] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDescripcion, setEvidenceDescripcion] = useState("");
  const [evidenceList, setEvidenceList] = useState<EvidenciaCotizacion[]>([]);
  const [selectedCotizacionId, setSelectedCotizacionId] = useState<
    string | null
  >(null);

  // Galería de imágenes
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Dialog para items
  const [itemDialog, setItemDialog] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    descripcion: "",
    cantidad: 1,
    precioUnitario: 0,
  });
  const [editingItem, setEditingItem] = useState<CotizacionItem | null>(null);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState<string>("");

  // Protección: solo admin
  useEffect(() => {
    if (user && user.rol !== "admin") {
      router.push("/dashboard");
    } else if (user) {
      loadCotizaciones();
    }
  }, [user, router]);

  async function loadCotizaciones() {
    try {
      const data = await getCotizacionesByEstado("pendiente");
      setCotizaciones(data);
    } catch (error) {
      console.error("Error loading cotizaciones:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Calcular total automáticamente basado en items
  const calcularTotalAutomatico = () => {
    const items = editingCotizacion?.cotizacion_items;
    if (!items || items.length === 0) {
      return 0;
    }

    return items.reduce(
      (sum: number, item: CotizacionItem) =>
        sum + item.cantidad * item.precio_unitario,
      0,
    );
  };

  // Actualizar el formulario cuando cambian los items
  useEffect(() => {
    if (editingCotizacion?.cotizacion_items) {
      const nuevoTotal = calcularTotalAutomatico();
      setEditFormData((prev) => ({
        ...prev,
        total: nuevoTotal,
      }));
    }
  }, [editingCotizacion?.cotizacion_items]);

  const handleEditCotizacion = async (cotizacion: CotizacionConRelaciones) => {
    try {
      const completa = await getCotizacionCompleta(cotizacion.id);
      setEditingCotizacion(completa);
      setEditFormData({
        descripcion: completa.descripcion || "",
        total: completa.total || 0,
      });
      setEditDialog(true);
    } catch (error) {
      console.error("Error loading cotización:", error);
    }
  };

  const handleSaveCotizacion = async () => {
    if (!editingCotizacion?.id) return;

    setIsSaving(true);
    try {
      await completarCotizacion(
        editingCotizacion.id,
        editFormData.descripcion,
        editFormData.total,
        "completada",
      );
      setEditDialog(false);
      await loadCotizaciones();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : String(error) || "Error desconocido";
      console.error("Error saving:", error);
      alert(`Error al guardar: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEvidenceDialog = async (cotizacionId: string) => {
    setSelectedCotizacionId(cotizacionId);
    try {
      const evidencia = await getEvidenciaCotizacion(cotizacionId);
      setEvidenceList(evidencia);
    } catch (error) {
      console.error("Error loading evidencia:", error);
    }
    setEvidenceDialog(true);
  };

  const handleDescargarPDF = async (cotizacionId: string) => {
    try {
      await exportarCotizacionPDF(cotizacionId);
    } catch (error) {
      console.error("Error descargando PDF:", error);
      alert("Error al descargar PDF");
    }
  };

  const handleUploadEvidence = async () => {
    if (!evidenceFile || !selectedCotizacionId) return;

    setIsSaving(true);
    try {
      const uploadedFile = await subirEvidenciaCotizacion(
        selectedCotizacionId,
        evidenceFile,
        evidenceDescripcion,
      );

      // Agregar el archivo subido directamente a la lista
      if (uploadedFile) {
        setEvidenceList((prev) => [uploadedFile, ...prev]);
        console.log("Archivo agregado a lista");
      } else {
        console.warn("uploadedFile es null/undefined");
      }

      setEvidenceFile(null);
      setEvidenceDescripcion("");
    } catch (error) {
      console.error("Error uploading:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : String(error) || "Error desconocido";
      alert(`Error al subir archivo: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!editingCotizacion?.id || !itemFormData.descripcion.trim()) {
      alert("Completa todos los campos");
      return;
    }

    setIsSaving(true);
    try {
      if (editingItem) {
        // Editar item existente
        await actualizarCotizacionItem(
          editingItem.id,
          itemFormData.descripcion,
          itemFormData.cantidad,
          itemFormData.precioUnitario,
          repuestoSeleccionado || undefined,
        );
      } else {
        // Crear nuevo item
        await crearCotizacionItem(
          editingCotizacion.id,
          itemFormData.descripcion,
          itemFormData.cantidad,
          itemFormData.precioUnitario,
          repuestoSeleccionado || undefined,
        );
      }

      // Recargar cotización
      const completa = await getCotizacionCompleta(editingCotizacion.id);
      setEditingCotizacion(completa);

      // Limpiar form
      setItemFormData({
        descripcion: "",
        cantidad: 1,
        precioUnitario: 0,
      });
      setEditingItem(null);
      setRepuestoSeleccionado("");
      setItemDialog(false);
    } catch (error) {
      console.error("Error adding/updating item:", error);
      alert("Error al guardar item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenItemDialog = async (item?: CotizacionItem) => {
    try {
      // Cargar repuestos
      const repuestosData = await getRepuestos();
      setRepuestos(repuestosData);
    } catch (error) {
      console.error("Error cargando repuestos:", error);
    }

    if (item) {
      // Editar item
      setEditingItem(item);
      setItemFormData({
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precio_unitario,
      });
      setRepuestoSeleccionado("");
    } else {
      // Nuevo item
      setEditingItem(null);
      setItemFormData({
        descripcion: "",
        cantidad: 1,
        precioUnitario: 0,
      });
      setRepuestoSeleccionado("");
    }

    setItemDialog(true);
  };

  const handleEditItem = (item: CotizacionItem) => {
    handleOpenItemDialog(item);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("¿Estás seguro de eliminar este item?")) return;

    setIsSaving(true);
    try {
      await eliminarCotizacionItem(itemId);

      // Recargar cotización
      const completa = await getCotizacionCompleta(editingCotizacion!.id);
      setEditingCotizacion(completa);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error al eliminar item");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Cotizaciones Pendientes
          </h1>
          <p className="text-muted-foreground">
            Completa y sube evidencia para las solicitudes de cotización
          </p>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Pendientes</CardTitle>
          <CardDescription>
            {cotizaciones.length} solicitud
            {cotizaciones.length !== 1 ? "es" : ""} en espera
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cotizaciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay cotizaciones pendientes
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Tipo Trabajo</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-12">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizaciones.map((cot) => (
                    <TableRow key={cot.id}>
                      <TableCell className="font-medium">
                        {cot.clientes?.nombre_empresa || cot.clientes?.nombre}
                      </TableCell>
                      <TableCell>
                        {cot.equipos?.modelo} ({cot.equipos?.serie})
                      </TableCell>
                      <TableCell>{cot.tipos_trabajo?.nombre}</TableCell>
                      <TableCell className="text-right">
                        {cot.total > 0
                          ? formatCurrency(cot.total)
                          : "Por completar"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(cot.created_at || "")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditCotizacion(cot)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenEvidenceDialog(cot.id)}>
                              <Upload className="mr-2 h-4 w-4" />
                              Evidencia
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDescargarPDF(cot.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Descargar PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Completar Cotización</DialogTitle>
            <DialogDescription>
              Agrega detalles, items y precio a la cotización
            </DialogDescription>
          </DialogHeader>

          {editingCotizacion && (
            <div className="space-y-6">
              {/* Información del Cliente */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="grid gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cliente</p>
                      <p className="font-medium">
                        {editingCotizacion.clientes?.nombre_empresa ||
                          editingCotizacion.clientes?.nombre}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Equipo</p>
                      <p className="font-medium">
                        {editingCotizacion.equipos?.modelo} (
                        {editingCotizacion.equipos?.serie})
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <div>
                <FieldLabel htmlFor="descripcion">Descripción</FieldLabel>
                <Textarea
                  id="descripcion"
                  value={editFormData.descripcion}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      descripcion: e.target.value,
                    })
                  }
                  placeholder="Detalles del trabajo a realizar..."
                  className="min-h-24"
                  disabled={isSaving}
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <FieldLabel>Items de Cotización</FieldLabel>
                  <Button
                    size="sm"
                    onClick={() => handleOpenItemDialog()}
                    disabled={isSaving}>
                    + Agregar Item
                  </Button>
                </div>

                {editingCotizacion.cotizacion_items &&
                editingCotizacion.cotizacion_items.length > 0 ? (
                  <div className="space-y-2">
                    {editingCotizacion.cotizacion_items.map(
                      (item: CotizacionItem, idx: number) => (
                        <div
                          key={item.id || idx}
                          className="p-3 border rounded-md flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">
                              {item.descripcion}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.cantidad} x{" "}
                              {formatCurrency(item.precio_unitario)} ={" "}
                              {formatCurrency(
                                item.cantidad * item.precio_unitario,
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditItem(item)}
                              disabled={isSaving}>
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={isSaving}>
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay items agregados
                  </p>
                )}
              </div>

              {/* Total */}
              <div>
                <FieldLabel htmlFor="total">
                  Precio Total (Calculado Automáticamente)
                </FieldLabel>
                <div className="p-3 border rounded-md bg-muted/50 text-lg font-bold text-right">
                  {formatCurrency(editFormData.total)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  El total se calcula automáticamente basado en los items
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog(false)}
              disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCotizacion} disabled={isSaving}>
              {isSaving && <Spinner className="mr-2 h-4 w-4" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog
        open={itemDialog}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            setItemFormData({
              descripcion: "",
              cantidad: 1,
              precioUnitario: 0,
            });
            setRepuestoSeleccionado("");
          }
          setItemDialog(open);
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Item" : "Agregar Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="repuestoSelect">
                  Seleccionar Repuesto (Opcional)
                </FieldLabel>
                <Select
                  value={repuestoSeleccionado}
                  onValueChange={(value) => {
                    setRepuestoSeleccionado(value);
                    if (value) {
                      const repuesto = repuestos.find((r) => r.id === value);
                      if (repuesto) {
                        setItemFormData({
                          ...itemFormData,
                          descripcion: repuesto.nombre,
                          precioUnitario:
                            typeof repuesto.costo === "string"
                              ? parseFloat(repuesto.costo)
                              : repuesto.costo,
                        });
                      }
                    }
                  }}>
                  <SelectTrigger id="repuestoSelect">
                    <SelectValue placeholder="Buscar o seleccionar repuesto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {repuestos.map((repuesto) => (
                      <SelectItem key={repuesto.id} value={repuesto.id}>
                        {repuesto.nombre} - ${repuesto.costo.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="itemDesc">Descripción *</FieldLabel>
                <Input
                  id="itemDesc"
                  value={itemFormData.descripcion}
                  onChange={(e) =>
                    setItemFormData({
                      ...itemFormData,
                      descripcion: e.target.value,
                    })
                  }
                  placeholder="Ej: Mano de obra, repuesto, etc..."
                  disabled={isSaving}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="itemCant">Cantidad</FieldLabel>
                <Input
                  id="itemCant"
                  type="number"
                  min="1"
                  value={itemFormData.cantidad}
                  onChange={(e) =>
                    setItemFormData({
                      ...itemFormData,
                      cantidad: parseInt(e.target.value) || 1,
                    })
                  }
                  disabled={isSaving}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="itemPrice">Precio Unitario</FieldLabel>
                <Input
                  id="itemPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemFormData.precioUnitario}
                  onChange={(e) =>
                    setItemFormData({
                      ...itemFormData,
                      precioUnitario: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={isSaving}
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setItemDialog(false)}
              disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleAddItem} disabled={isSaving}>
              {editingItem ? "Guardar Cambios" : "Agregar Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Dialog */}
      <Dialog open={evidenceDialog} onOpenChange={setEvidenceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Evidencia de Cotización</DialogTitle>
            <DialogDescription>Sube imágenes o documentos</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Form */}
            <div className="border-2 border-dashed rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <FieldLabel htmlFor="evidence">Archivo</FieldLabel>
                  <Input
                    id="evidence"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setEvidenceFile(e.target.files?.[0] || null)
                    }
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Imágenes o PDF {evidenceFile && `(${evidenceFile.name})`}
                  </p>
                </div>
                <div>
                  <FieldLabel htmlFor="evidenceDesc">
                    Descripción (Opcional)
                  </FieldLabel>
                  <Input
                    id="evidenceDesc"
                    placeholder="Ej: Vista general, detalle, etc..."
                    value={evidenceDescripcion}
                    onChange={(e) => setEvidenceDescripcion(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <Button
                  onClick={handleUploadEvidence}
                  disabled={!evidenceFile || isSaving}
                  className="w-full">
                  {isSaving ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir Archivo
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Evidence List */}
            <div>
              <FieldLabel>Archivos Subidos</FieldLabel>
              {evidenceList.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {evidenceList.map((ev, idx) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setSelectedImageIndex(idx);
                        setGalleryOpen(true);
                      }}
                      className="flex items-center gap-2 p-3 border rounded text-sm cursor-pointer hover:bg-muted/50 transition">
                      <div className="flex-shrink-0">
                        {ev.nombre_archivo
                          .toLowerCase()
                          .match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={ev.archivo_url}
                            alt={ev.nombre_archivo}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <FileText className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-sm">
                          {ev.nombre_archivo}
                        </p>
                        {ev.descripcion && (
                          <p className="text-xs text-muted-foreground truncate">
                            {ev.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Sin archivos aún
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEvidenceDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Galería de Evidencia</DialogTitle>
          </DialogHeader>

          {evidenceList.length > 0 && evidenceList[selectedImageIndex] && (
            <div className="space-y-4">
              {/* Main Image */}
              <div className="bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-96">
                {evidenceList[selectedImageIndex].nombre_archivo
                  .toLowerCase()
                  .match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={evidenceList[selectedImageIndex].archivo_url}
                    alt={evidenceList[selectedImageIndex].nombre_archivo}
                    className="max-w-full max-h-96 object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {evidenceList[selectedImageIndex].nombre_archivo}
                    </p>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-2">
                <p className="font-medium break-all">
                  {evidenceList[selectedImageIndex].nombre_archivo}
                </p>
                {evidenceList[selectedImageIndex].descripcion && (
                  <p className="text-sm text-muted-foreground">
                    {evidenceList[selectedImageIndex].descripcion}
                  </p>
                )}
              </div>

              {/* Thumbnails */}
              {evidenceList.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {evidenceList.map((file, idx) => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`flex-shrink-0 rounded border-2 overflow-hidden ${
                        idx === selectedImageIndex
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground"
                      }`}>
                      {file.nombre_archivo
                        .toLowerCase()
                        .match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={file.archivo_url}
                          alt={file.nombre_archivo}
                          className="h-16 w-16 object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-muted flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-2 justify-between">
                <Button
                  variant="outline"
                  onClick={() =>
                    setSelectedImageIndex(
                      (evidenceList.length + selectedImageIndex - 1) %
                        evidenceList.length,
                    )
                  }
                  disabled={evidenceList.length <= 1}>
                  ← Anterior
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  {selectedImageIndex + 1} / {evidenceList.length}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setSelectedImageIndex(
                      (selectedImageIndex + 1) % evidenceList.length,
                    )
                  }
                  disabled={evidenceList.length <= 1}>
                  Siguiente →
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
