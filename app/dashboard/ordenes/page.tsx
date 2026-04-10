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
  getOrdenes,
  getOrdenesByTecnicoId,
  getOrdenesByClienteId,
  getClientes,
  getTecnicos,
  getEquipos,
  getEquiposByClienteId,
  createOrden,
  updateOrden,
  getTecnicoByUsuarioId,
  getClienteByUsuarioId,
  formatDate,
  getEstadoColor,
  getPrioridadColor,
} from "@/lib/api";
import type {
  OrdenTrabajoExtendida,
  Cliente,
  Tecnico,
  Equipo,
  EstadoOrden,
} from "@/lib/types";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  UserPlus,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function OrdenesPage() {
  const { user } = useAuth();
  const [ordenes, setOrdenes] = useState<OrdenTrabajoExtendida[]>([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState<
    OrdenTrabajoExtendida[]
  >([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAsignDialogOpen, setIsAsignDialogOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] =
    useState<OrdenTrabajoExtendida | null>(null);
  const [clienteEquipos, setClienteEquipos] = useState<Equipo[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    estado: "pendiente" as EstadoOrden,
    cliente_id: "",
    tecnico_id: "",
    equipo_id: "",
    descripcion: "",
    prioridad: "media" as "baja" | "media" | "alta",
  });

  const [asignTecnicoId, setAsignTecnicoId] = useState("");

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    let filtered = ordenes;

    if (searchTerm) {
      filtered = filtered.filter(
        (orden) =>
          orden.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          orden.cliente?.nombre
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          orden.tecnico?.nombre
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    if (filterEstado !== "todos") {
      filtered = filtered.filter((orden) => orden.estado === filterEstado);
    }

    setFilteredOrdenes(filtered);
  }, [searchTerm, filterEstado, ordenes]);

  async function loadData() {
    if (!user) return;

    try {
      let ordenesData: OrdenTrabajoExtendida[] = [];

      if (user.rol === "admin") {
        ordenesData = await getOrdenes();
        const [clientesData, tecnicosData, equiposData] = await Promise.all([
          getClientes(),
          getTecnicos(),
          getEquipos(),
        ]);
        setClientes(clientesData);
        setTecnicos(tecnicosData);
        setEquipos(equiposData);
      } else if (user.rol === "tecnico") {
        const tecnico = await getTecnicoByUsuarioId(user.id);
        if (tecnico) {
          ordenesData = await getOrdenesByTecnicoId(tecnico.id);
        }
      } else if (user.rol === "cliente") {
        const cliente = await getClienteByUsuarioId(user.id);
        if (cliente) {
          ordenesData = await getOrdenesByClienteId(cliente.id);
          const equiposData = await getEquiposByClienteId(cliente.id);
          setClienteEquipos(equiposData);
        }
      }

      setOrdenes(ordenesData);
      setFilteredOrdenes(ordenesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleClienteChange = async (clienteId: string) => {
    setFormData({ ...formData, cliente_id: clienteId, equipo_id: "" });
    if (clienteId) {
      const equiposCliente = await getEquiposByClienteId(clienteId);
      setClienteEquipos(equiposCliente);
    } else {
      setClienteEquipos([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrden({
        ...formData,
        tecnico_id: formData.tecnico_id || null,
      });
      await loadData();
      setIsDialogOpen(false);
      setFormData({
        fecha: new Date().toISOString().split("T")[0],
        estado: "pendiente",
        cliente_id: "",
        tecnico_id: "",
        equipo_id: "",
        descripcion: "",
        prioridad: "media",
      });
    } catch (error) {
      console.error("Error creating orden:", error);
    }
  };

  const handleAsignarTecnico = async () => {
    if (!selectedOrden || !asignTecnicoId) return;
    try {
      await updateOrden(selectedOrden.id, {
        tecnico_id: asignTecnicoId,
        estado: "asignada",
      });
      await loadData();
      setIsAsignDialogOpen(false);
      setAsignTecnicoId("");
    } catch (error) {
      console.error("Error asigning tecnico:", error);
    }
  };

  const handleUpdateEstado = async (ordenId: string, estado: EstadoOrden) => {
    try {
      await updateOrden(ordenId, { estado });
      await loadData();
    } catch (error) {
      console.error("Error updating estado:", error);
    }
  };

  const openAsignDialog = (orden: OrdenTrabajoExtendida) => {
    setSelectedOrden(orden);
    setAsignTecnicoId(orden.tecnico_id || "");
    setIsAsignDialogOpen(true);
  };

  // Stats
  const ordenesActivas = ordenes.filter(
    (o) => o.estado !== "completada" && o.estado !== "cancelada",
  ).length;
  const ordenesCompletadas = ordenes.filter(
    (o) => o.estado === "completada",
  ).length;
  const ordenesPendientes = ordenes.filter(
    (o) => o.estado === "pendiente",
  ).length;

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
            Órdenes de Trabajo
          </h1>
          <p className="text-muted-foreground">
            {user?.rol === "admin"
              ? "Gestión de todas las órdenes"
              : user?.rol === "tecnico"
                ? "Mis órdenes asignadas"
                : "Mis solicitudes de servicio"}
          </p>
        </div>
        {(user?.rol === "admin" || user?.rol === "cliente") && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {user?.rol === "cliente" ? "Solicitar Servicio" : "Nueva Orden"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {user?.rol === "cliente"
                    ? "Solicitar Servicio"
                    : "Nueva Orden de Trabajo"}
                </DialogTitle>
                <DialogDescription>
                  {user?.rol === "cliente"
                    ? "Solicita un servicio de mantenimiento para tus equipos"
                    : "Crea una nueva orden de trabajo para un cliente"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  {user?.rol === "admin" && (
                    <Field>
                      <FieldLabel>Cliente</FieldLabel>
                      <Select
                        value={formData.cliente_id}
                        onValueChange={handleClienteChange}>
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
                  )}
                  <Field>
                    <FieldLabel>Equipo</FieldLabel>
                    <Select
                      value={formData.equipo_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, equipo_id: value })
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el equipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {(user?.rol === "cliente"
                          ? clienteEquipos
                          : clienteEquipos
                        ).map((equipo) => (
                          <SelectItem key={equipo.id} value={equipo.id}>
                            {equipo.tipo} - {equipo.marca} {equipo.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Descripción del Servicio</FieldLabel>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descripcion: e.target.value,
                        })
                      }
                      placeholder="Describe el problema o servicio requerido..."
                      required
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Prioridad</FieldLabel>
                      <Select
                        value={formData.prioridad}
                        onValueChange={(value: "baja" | "media" | "alta") =>
                          setFormData({ ...formData, prioridad: value })
                        }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    {user?.rol === "admin" && (
                      <Field>
                        <FieldLabel>Técnico (Opcional)</FieldLabel>
                        <Select
                          value={formData.tecnico_id}
                          onValueChange={(value) =>
                            setFormData({ ...formData, tecnico_id: value })
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin asignar" />
                          </SelectTrigger>
                          <SelectContent>
                            {tecnicos
                              .filter((t) => t.disponible)
                              .map((tecnico) => (
                                <SelectItem key={tecnico.id} value={tecnico.id}>
                                  {tecnico.nombre}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </div>
                </FieldGroup>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {user?.rol === "cliente"
                      ? "Enviar Solicitud"
                      : "Crear Orden"}
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
                  Total Órdenes
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {ordenes.length}
                </p>
              </div>
              <ClipboardList className="h-8 w-8 text-primary" />
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
                  {ordenesPendientes}
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
                  En Progreso
                </p>
                <p className="text-3xl font-bold text-primary">
                  {ordenesActivas - ordenesPendientes}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completadas
                </p>
                <p className="text-3xl font-bold text-success">
                  {ordenesCompletadas}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar órdenes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="asignada">Asignada</SelectItem>
            <SelectItem value="en_progreso">En Progreso</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Órdenes</CardTitle>
          <CardDescription>
            {filteredOrdenes.length} órdenes encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                {user?.rol !== "cliente" && <TableHead>Cliente</TableHead>}
                <TableHead>Equipo</TableHead>
                {user?.rol !== "tecnico" && <TableHead>Técnico</TableHead>}
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrdenes.map((orden) => (
                <TableRow key={orden.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground line-clamp-1">
                        {orden.descripcion}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {orden.id}
                      </p>
                    </div>
                  </TableCell>
                  {user?.rol !== "cliente" && (
                    <TableCell className="text-muted-foreground">
                      {orden.cliente?.nombre || "N/A"}
                    </TableCell>
                  )}
                  <TableCell>
                    <p className="text-sm">{orden.equipo?.tipo}</p>
                    <p className="text-xs text-muted-foreground">
                      {orden.equipo?.marca} {orden.equipo?.modelo}
                    </p>
                  </TableCell>
                  {user?.rol !== "tecnico" && (
                    <TableCell>
                      {orden.tecnico ? (
                        <span className="text-muted-foreground">
                          {orden.tecnico.nombre}
                        </span>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-warning/10 text-warning-foreground">
                          Sin asignar
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getEstadoColor(orden.estado)}>
                      {orden.estado.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getPrioridadColor(orden.prioridad)}>
                      {orden.prioridad}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(orden.fecha)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/ordenes/${orden.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </Link>
                        </DropdownMenuItem>
                        {user?.rol === "admin" && !orden.tecnico_id && (
                          <DropdownMenuItem
                            onClick={() => openAsignDialog(orden)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Asignar Técnico
                          </DropdownMenuItem>
                        )}
                        {user?.rol === "admin" &&
                          orden.estado !== "completada" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateEstado(orden.id, "completada")
                              }>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Marcar Completada
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

      {/* Asignar Técnico Dialog */}
      <Dialog open={isAsignDialogOpen} onOpenChange={setIsAsignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Técnico</DialogTitle>
            <DialogDescription>
              Selecciona un técnico para esta orden de trabajo
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel>Técnico</FieldLabel>
            <Select value={asignTecnicoId} onValueChange={setAsignTecnicoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un técnico" />
              </SelectTrigger>
              <SelectContent>
                {tecnicos
                  .filter((t) => t.disponible)
                  .map((tecnico) => (
                    <SelectItem key={tecnico.id} value={tecnico.id}>
                      {tecnico.nombre} - {tecnico.especialidad}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAsignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAsignarTecnico}>Asignar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
