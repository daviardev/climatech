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
  getEquipos,
  getClientes,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  formatDate,
} from "@/lib/api";
import type { Equipo, Cliente } from "@/lib/types";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Thermometer,
  Calendar,
  Hash,
  Building2,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const TIPOS_EQUIPO = [
  "Aire Acondicionado Split",
  "Aire Acondicionado Central",
  "Mini Split Inverter",
  "Aire Acondicionado Cassette",
  "Chiller",
  "Torre de Enfriamiento",
  "Fan Coil",
  "Unidad Manejadora de Aire",
  "Sistema VRF",
];

export default function EquiposPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredEquipos, setFilteredEquipos] = useState<Equipo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<Equipo | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    tipo: "",
    marca: "",
    modelo: "",
    cliente_id: "",
    numero_serie: "",
    fecha_instalacion: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = equipos.filter(
      (equipo) =>
        equipo.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredEquipos(filtered);
  }, [searchTerm, equipos]);

  async function loadData() {
    try {
      const [equiposData, clientesData] = await Promise.all([
        getEquipos(),
        getClientes(),
      ]);
      setEquipos(equiposData);
      setFilteredEquipos(equiposData);
      setClientes(clientesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const getClienteName = (clienteId: string) => {
    return clientes.find((c) => c.id === clienteId)?.nombre || "N/A";
  };

  // Obtener la fecha de hoy en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const handleOpenDialog = (equipo?: Equipo) => {
    if (equipo) {
      setEditingEquipo(equipo);
      setFormData({
        tipo: equipo.tipo,
        marca: equipo.marca,
        modelo: equipo.modelo,
        cliente_id: equipo.cliente_id,
        numero_serie: equipo.numero_serie || "",
        fecha_instalacion: equipo.fecha_instalacion || "",
      });
    } else {
      setEditingEquipo(null);
      setFormData({
        tipo: "",
        marca: "",
        modelo: "",
        cliente_id: "",
        numero_serie: "",
        fecha_instalacion: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar fecha de instalación
      if (formData.fecha_instalacion) {
        const fechaInstalacion = new Date(formData.fecha_instalacion);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Resetear hora para comparar solo fechas

        if (fechaInstalacion < today) {
          alert("La fecha de instalación no puede ser anterior a hoy");
          return;
        }
      }
      if (editingEquipo) {
        await updateEquipo(editingEquipo.id, formData);
      } else {
        await createEquipo(formData);
      }
      await loadData();
      setIsDialogOpen(false);
      setFormData({
        tipo: "",
        marca: "",
        modelo: "",
        cliente_id: "",
        numero_serie: "",
        fecha_instalacion: "",
      });
    } catch (error) {
      console.error("Error saving equipo:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este equipo?")) {
      try {
        await deleteEquipo(id);
        await loadData();
      } catch (error) {
        console.error("Error deleting equipo:", error);
      }
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
          <h1 className="text-2xl font-bold text-foreground">Equipos</h1>
          <p className="text-muted-foreground">
            Gestión de equipos de climatización
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingEquipo ? "Editar Equipo" : "Nuevo Equipo"}
              </DialogTitle>
              <DialogDescription>
                {editingEquipo
                  ? "Modifica los datos del equipo"
                  : "Registra un nuevo equipo de climatización"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="tipo">Tipo de Equipo</FieldLabel>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo: value })
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_EQUIPO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="marca">Marca</FieldLabel>
                    <Input
                      id="marca"
                      value={formData.marca}
                      onChange={(e) =>
                        setFormData({ ...formData, marca: e.target.value })
                      }
                      placeholder="Ej: Samsung"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="modelo">Modelo</FieldLabel>
                    <Input
                      id="modelo"
                      value={formData.modelo}
                      onChange={(e) =>
                        setFormData({ ...formData, modelo: e.target.value })
                      }
                      placeholder="Ej: AR24TV"
                      required
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="cliente_id">Cliente</FieldLabel>
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
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="numero_serie">
                      Número de Serie
                    </FieldLabel>
                    <Input
                      id="numero_serie"
                      value={formData.numero_serie}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numero_serie: e.target.value,
                        })
                      }
                      placeholder="Ej: SAM-2024-001"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="fecha_instalacion">
                      Fecha Instalación
                    </FieldLabel>
                    <Input
                      id="fecha_instalacion"
                      type="date"
                      value={formData.fecha_instalacion}
                      min={getTodayDate()}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha_instalacion: e.target.value,
                        })
                      }
                    />
                  </Field>
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
                  {editingEquipo ? "Guardar Cambios" : "Crear Equipo"}
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
                  Total Equipos
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {equipos.length}
                </p>
              </div>
              <Thermometer className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tipos de Equipos
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {new Set(equipos.map((e) => e.tipo)).size}
                </p>
              </div>
              <Hash className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Clientes con Equipos
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {new Set(equipos.map((e) => e.cliente_id)).size}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar equipos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Equipos</CardTitle>
          <CardDescription>
            {filteredEquipos.length} equipos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serie</TableHead>
                <TableHead>Instalación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipos.map((equipo) => (
                <TableRow key={equipo.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <Thermometer className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {equipo.tipo}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {equipo.marca} - {equipo.modelo}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {getClienteName(equipo.cliente_id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {equipo.numero_serie || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4" />
                      {equipo.fecha_instalacion
                        ? formatDate(equipo.fecha_instalacion)
                        : "N/A"}
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
                          onClick={() => handleOpenDialog(equipo)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(equipo.id)}
                          className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
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
    </div>
  );
}
