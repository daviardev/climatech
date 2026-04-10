"use client";

import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  getTecnicos,
  createTecnico,
  updateTecnico,
  getOrdenesByTecnicoId,
} from "@/lib/api";
import type { Tecnico, OrdenTrabajoExtendida } from "@/lib/types";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  User,
  Wrench,
  ClipboardList,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [filteredTecnicos, setFilteredTecnicos] = useState<Tecnico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTecnico, setEditingTecnico] = useState<Tecnico | null>(null);
  const [selectedTecnico, setSelectedTecnico] = useState<Tecnico | null>(null);
  const [tecnicoOrdenes, setTecnicoOrdenes] = useState<OrdenTrabajoExtendida[]>(
    [],
  );
  const [isOrdenesDialogOpen, setIsOrdenesDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    especialidad: "",
    usuario_id: "",
    disponible: true,
  });

  useEffect(() => {
    loadTecnicos();
  }, []);

  useEffect(() => {
    const filtered = tecnicos.filter(
      (tecnico) =>
        tecnico.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tecnico.especialidad.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredTecnicos(filtered);
  }, [searchTerm, tecnicos]);

  async function loadTecnicos() {
    try {
      const data = await getTecnicos();
      setTecnicos(data);
      setFilteredTecnicos(data);
    } catch (error) {
      console.error("Error loading tecnicos:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenDialog = (tecnico?: Tecnico) => {
    if (tecnico) {
      setEditingTecnico(tecnico);
      setFormData({
        nombre: tecnico.nombre,
        especialidad: tecnico.especialidad,
        usuario_id: tecnico.usuario_id,
        disponible: tecnico.disponible,
      });
    } else {
      setEditingTecnico(null);
      setFormData({
        nombre: "",
        especialidad: "",
        usuario_id: "",
        disponible: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTecnico) {
        await updateTecnico(editingTecnico.id, formData);
      } else {
        await createTecnico(formData);
      }
      await loadTecnicos();
      setIsDialogOpen(false);
      setFormData({
        nombre: "",
        especialidad: "",
        usuario_id: "",
        disponible: true,
      });
    } catch (error) {
      console.error("Error saving tecnico:", error);
    }
  };

  const handleToggleDisponible = async (tecnico: Tecnico) => {
    try {
      await updateTecnico(tecnico.id, { disponible: !tecnico.disponible });
      await loadTecnicos();
    } catch (error) {
      console.error("Error updating disponibilidad:", error);
    }
  };

  const handleViewOrdenes = async (tecnico: Tecnico) => {
    setSelectedTecnico(tecnico);
    const ordenes = await getOrdenesByTecnicoId(tecnico.id);
    setTecnicoOrdenes(ordenes);
    setIsOrdenesDialogOpen(true);
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
          <h1 className="text-2xl font-bold text-foreground">Técnicos</h1>
          <p className="text-muted-foreground">Gestión del personal técnico</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Técnico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTecnico ? "Editar Técnico" : "Nuevo Técnico"}
              </DialogTitle>
              <DialogDescription>
                {editingTecnico
                  ? "Modifica los datos del técnico"
                  : "Completa los datos para registrar un nuevo técnico"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="nombre">Nombre Completo</FieldLabel>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="especialidad">Especialidad</FieldLabel>
                  <Input
                    id="especialidad"
                    value={formData.especialidad}
                    onChange={(e) =>
                      setFormData({ ...formData, especialidad: e.target.value })
                    }
                    placeholder="Ej: Aires Acondicionados Split"
                    required
                  />
                </Field>
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="disponible">
                      Disponible para asignación
                    </FieldLabel>
                    <Switch
                      id="disponible"
                      checked={formData.disponible}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, disponible: checked })
                      }
                    />
                  </div>
                </Field>
              </FieldGroup>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTecnico ? "Guardar Cambios" : "Crear Técnico"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Técnicos
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {tecnicos.length}
                </p>
              </div>
              <User className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Disponibles
                </p>
                <p className="text-3xl font-bold text-success">
                  {tecnicos.filter((t) => t.disponible).length}
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
                  No Disponibles
                </p>
                <p className="text-3xl font-bold text-warning">
                  {tecnicos.filter((t) => !t.disponible).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar técnicos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Técnicos</CardTitle>
          <CardDescription>
            {filteredTecnicos.length} técnicos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Técnico</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTecnicos.map((tecnico) => (
                <TableRow key={tecnico.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {tecnico.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {tecnico.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wrench className="h-4 w-4" />
                      {tecnico.especialidad}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          tecnico.disponible
                            ? "bg-success/10 text-success border-success/30"
                            : "bg-warning/10 text-warning-foreground border-warning/30"
                        }>
                        {tecnico.disponible ? "Disponible" : "No Disponible"}
                      </Badge>
                      <Switch
                        checked={tecnico.disponible}
                        onCheckedChange={() => handleToggleDisponible(tecnico)}
                      />
                    </div>
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
                          onClick={() => handleViewOrdenes(tecnico)}>
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Ver Órdenes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDialog(tecnico)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ordenes Dialog */}
      <Dialog open={isOrdenesDialogOpen} onOpenChange={setIsOrdenesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Órdenes de {selectedTecnico?.nombre}</DialogTitle>
            <DialogDescription>
              Historial de órdenes de trabajo asignadas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {tecnicoOrdenes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Este técnico no tiene órdenes asignadas
              </p>
            ) : (
              tecnicoOrdenes.map((orden) => (
                <div
                  key={orden.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">
                      {orden.descripcion}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {orden.cliente?.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {orden.fecha}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      orden.estado === "completada"
                        ? "bg-success/10 text-success border-success/30"
                        : orden.estado === "en_progreso"
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-warning/10 text-warning-foreground border-warning/30"
                    }>
                    {orden.estado.replace("_", " ")}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
