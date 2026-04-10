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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getEquiposByClienteId,
  getAvailableUsuariosForCliente,
} from "@/lib/api";
import type { Cliente, Equipo, User } from "@/lib/types";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Phone,
  MapPin,
  Thermometer,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteEquipos, setClienteEquipos] = useState<Equipo[]>([]);
  const [isEquiposDialogOpen, setIsEquiposDialogOpen] = useState(false);
  const [usuarios, setUsuarios] = useState<User[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    usuario_id: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadClientes();
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    try {
      const data = await getAvailableUsuariosForCliente();
      setUsuarios(data);
    } catch (error) {
      console.error("Error loading usuarios:", error);
    }
  }

  useEffect(() => {
    const filtered = clientes.filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.telefono.includes(searchTerm) ||
        cliente.direccion.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredClientes(filtered);
  }, [searchTerm, clientes]);

  async function loadClientes() {
    try {
      const data = await getClientes();
      setClientes(data);
      setFilteredClientes(data);
    } catch (error) {
      console.error("Error loading clientes:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenDialog = (cliente?: Cliente) => {
    setFormError("");
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        usuario_id: cliente.usuario_id,
      });
    } else {
      setEditingCliente(null);
      setFormData({ nombre: "", telefono: "", direccion: "", usuario_id: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación
    setFormError("");
    if (!formData.nombre.trim()) {
      setFormError("El nombre es requerido");
      return;
    }
    if (!formData.telefono.trim()) {
      setFormError("El teléfono es requerido");
      return;
    }
    if (!formData.direccion.trim()) {
      setFormError("La dirección es requerida");
      return;
    }
    if (!formData.usuario_id) {
      setFormError("Debes seleccionar un usuario");
      return;
    }

    setIsSaving(true);
    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, formData);
      } else {
        await createCliente(formData);
      }
      await loadClientes();
      await loadUsuarios(); // Recarga usuarios disponibles
      setIsDialogOpen(false);
      setFormData({ nombre: "", telefono: "", direccion: "", usuario_id: "" });
      setFormError("");
    } catch (error) {
      console.error("Error saving cliente:", error);
      setFormError("Error al guardar cliente. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este cliente?")) {
      try {
        await deleteCliente(id);
        await loadClientes();
        await loadUsuarios(); // Recarga usuarios disponibles
      } catch (error) {
        console.error("Error deleting cliente:", error);
      }
    }
  };

  const handleViewEquipos = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    const equipos = await getEquiposByClienteId(cliente.id);
    setClienteEquipos(equipos);
    setIsEquiposDialogOpen(true);
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
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Gestión de clientes del sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {editingCliente
                  ? "Modifica los datos del cliente"
                  : "Completa los datos para registrar un nuevo cliente"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              {formError && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {formError}
                </div>
              )}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="nombre">
                    Nombre / Razón Social *
                  </FieldLabel>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    disabled={isSaving}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="telefono">Teléfono *</FieldLabel>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    disabled={isSaving}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="direccion">Dirección *</FieldLabel>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) =>
                      setFormData({ ...formData, direccion: e.target.value })
                    }
                    disabled={isSaving}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="usuario_id">Usuario *</FieldLabel>
                  <Select
                    value={formData.usuario_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, usuario_id: value })
                    }
                    disabled={isSaving}>
                    <SelectTrigger id="usuario_id">
                      <SelectValue placeholder="Selecciona un usuario cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map((usuario) => (
                        <SelectItem key={usuario.id} value={usuario.id}>
                          {usuario.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Guardando...
                    </>
                  ) : editingCliente ? (
                    "Guardar Cambios"
                  ) : (
                    "Crear Cliente"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Clientes</CardTitle>
          <CardDescription>
            {filteredClientes.length} clientes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {cliente.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {cliente.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {cliente.telefono}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground max-w-xs truncate">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      {cliente.direccion}
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
                          onClick={() => handleViewEquipos(cliente)}>
                          <Thermometer className="mr-2 h-4 w-4" />
                          Ver Equipos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDialog(cliente)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(cliente.id)}
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

      {/* Equipos Dialog */}
      <Dialog open={isEquiposDialogOpen} onOpenChange={setIsEquiposDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Equipos de {selectedCliente?.nombre}</DialogTitle>
            <DialogDescription>
              Lista de equipos de climatización asociados
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {clienteEquipos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Este cliente no tiene equipos registrados
              </p>
            ) : (
              clienteEquipos.map((equipo) => (
                <div
                  key={equipo.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-4">
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
                  <Badge variant="outline">{equipo.numero_serie}</Badge>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
