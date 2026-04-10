"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  getCotizaciones,
  getCotizacionesByClienteId,
  getClientes,
  createCotizacion,
  updateCotizacion,
  getClienteByUsuarioId,
  formatCurrency,
  formatDate,
  getEstadoColor,
} from "@/lib/api";
import type {
  CotizacionExtendida,
  Cliente,
  CotizacionItem,
  EstadoCotizacion,
} from "@/lib/types";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function CotizacionesPage() {
  const { user } = useAuth();
  const [cotizaciones, setCotizaciones] = useState<CotizacionExtendida[]>([]);
  const [filteredCotizaciones, setFilteredCotizaciones] = useState<
    CotizacionExtendida[]
  >([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] =
    useState<CotizacionExtendida | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    cliente_id: "",
    descripcion: "",
    items: [] as CotizacionItem[],
  });

  const [newItem, setNewItem] = useState({
    descripcion: "",
    cantidad: 1,
    precio_unitario: 0,
  });

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    const filtered = cotizaciones.filter(
      (cotizacion) =>
        cotizacion.descripcion
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        cotizacion.cliente?.nombre
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
    setFilteredCotizaciones(filtered);
  }, [searchTerm, cotizaciones]);

  async function loadData() {
    if (!user) return;

    try {
      let cotizacionesData: CotizacionExtendida[] = [];

      if (user.rol === "admin") {
        cotizacionesData = await getCotizaciones();
        const clientesData = await getClientes();
        setClientes(clientesData);
      } else if (user.rol === "cliente") {
        const cliente = await getClienteByUsuarioId(user.id);
        if (cliente) {
          cotizacionesData = await getCotizacionesByClienteId(cliente.id);
        }
      }

      setCotizaciones(cotizacionesData);
      setFilteredCotizaciones(cotizacionesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const calcularTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + item.cantidad * item.precio_unitario,
      0,
    );
  };

  const handleAddItem = () => {
    if (!newItem.descripcion || newItem.precio_unitario <= 0) return;

    const item: CotizacionItem = {
      id: String(formData.items.length + 1),
      ...newItem,
    };
    setFormData({ ...formData, items: [...formData.items, item] });
    setNewItem({ descripcion: "", cantidad: 1, precio_unitario: 0 });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCotizacion({
        fecha: new Date().toISOString().split("T")[0],
        total: calcularTotal(),
        estado: "pendiente",
        cliente_id: formData.cliente_id,
        descripcion: formData.descripcion,
        items: formData.items,
      });
      await loadData();
      setIsDialogOpen(false);
      setFormData({ cliente_id: "", descripcion: "", items: [] });
    } catch (error) {
      console.error("Error creating cotizacion:", error);
    }
  };

  const handleUpdateEstado = async (id: string, estado: EstadoCotizacion) => {
    try {
      await updateCotizacion(id, { estado });
      await loadData();
    } catch (error) {
      console.error("Error updating cotizacion:", error);
    }
  };

  const handleViewCotizacion = (cotizacion: CotizacionExtendida) => {
    setSelectedCotizacion(cotizacion);
    setIsViewDialogOpen(true);
  };

  // Stats
  const totalPendientes = cotizaciones.filter(
    (c) => c.estado === "pendiente",
  ).length;
  const totalAprobadas = cotizaciones.filter(
    (c) => c.estado === "aprobada",
  ).length;
  const montoTotal = cotizaciones
    .filter((c) => c.estado === "aprobada")
    .reduce((sum, c) => sum + c.total, 0);

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
          <h1 className="text-2xl font-bold text-foreground">Cotizaciones</h1>
          <p className="text-muted-foreground">
            {user?.rol === "admin"
              ? "Gestión de cotizaciones"
              : "Mis cotizaciones recibidas"}
          </p>
        </div>
        {user?.rol === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cotización
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva Cotización</DialogTitle>
                <DialogDescription>
                  Crea una nueva cotización para un cliente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Cliente</FieldLabel>
                    <Select
                      value={formData.cliente_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, cliente_id: value })
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Descripción</FieldLabel>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descripcion: e.target.value,
                        })
                      }
                      placeholder="Descripción general de la cotización..."
                      required
                    />
                  </Field>
                </FieldGroup>

                {/* Items */}
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Items de la Cotización</h4>
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {item.descripcion}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.cantidad} x{" "}
                            {formatCurrency(item.precio_unitario)}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(item.cantidad * item.precio_unitario)}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add Item */}
                  <div className="mt-4 p-4 border border-dashed border-border rounded-lg">
                    <p className="text-sm font-medium mb-3">Agregar Item</p>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <Input
                        placeholder="Descripción"
                        value={newItem.descripcion}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            descripcion: e.target.value,
                          })
                        }
                        className="sm:col-span-2"
                      />
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        value={newItem.cantidad}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            cantidad: parseInt(e.target.value) || 1,
                          })
                        }
                        min="1"
                      />
                      <Input
                        type="number"
                        placeholder="Precio"
                        value={newItem.precio_unitario || ""}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            precio_unitario: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleAddItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Item
                    </Button>
                  </div>

                  {/* Total */}
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg flex items-center justify-between">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(calcularTotal())}
                    </span>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={formData.items.length === 0}>
                    Crear Cotización
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Cotizaciones
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {cotizaciones.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pendientes
                </p>
                <p className="text-3xl font-bold text-warning">
                  {totalPendientes}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aprobadas
                </p>
                <p className="text-3xl font-bold text-success">
                  {totalAprobadas}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monto Aprobado
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(montoTotal)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar cotizaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Cotizaciones</CardTitle>
          <CardDescription>
            {filteredCotizaciones.length} cotizaciones encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cotización</TableHead>
                {user?.rol === "admin" && <TableHead>Cliente</TableHead>}
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCotizaciones.map((cotizacion) => (
                <TableRow key={cotizacion.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground line-clamp-1">
                        {cotizacion.descripcion}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cotizacion.items.length} items
                      </p>
                    </div>
                  </TableCell>
                  {user?.rol === "admin" && (
                    <TableCell className="text-muted-foreground">
                      {cotizacion.cliente?.nombre || "N/A"}
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="font-medium">
                      {formatCurrency(cotizacion.total)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getEstadoColor(cotizacion.estado)}>
                      {cotizacion.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(cotizacion.fecha)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewCotizacion(cotizacion)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                        {user?.rol === "admin" &&
                          cotizacion.estado === "pendiente" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateEstado(cotizacion.id, "aprobada")
                                }>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Aprobar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateEstado(cotizacion.id, "rechazada")
                                }>
                                <XCircle className="mr-2 h-4 w-4" />
                                Rechazar
                              </DropdownMenuItem>
                            </>
                          )}
                        {user?.rol === "cliente" &&
                          cotizacion.estado === "pendiente" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateEstado(cotizacion.id, "aprobada")
                              }>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Aceptar Cotización
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de Cotización</DialogTitle>
            <DialogDescription>
              {selectedCotizacion?.descripcion}
            </DialogDescription>
          </DialogHeader>
          {selectedCotizacion && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">
                  {selectedCotizacion.cliente?.nombre}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fecha:</span>
                <span>{formatDate(selectedCotizacion.fecha)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estado:</span>
                <Badge
                  variant="outline"
                  className={getEstadoColor(selectedCotizacion.estado)}>
                  {selectedCotizacion.estado}
                </Badge>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-medium mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedCotizacion.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.descripcion}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.cantidad} x{" "}
                          {formatCurrency(item.precio_unitario)}
                        </p>
                      </div>
                      <span>
                        {formatCurrency(item.cantidad * item.precio_unitario)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="font-medium text-lg">Total:</span>
                <span className="text-xl font-bold">
                  {formatCurrency(selectedCotizacion.total)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
