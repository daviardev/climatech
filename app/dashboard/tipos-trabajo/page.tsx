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
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wrench,
  Badge,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  getTiposTrabajo,
  createTipoTrabajo,
  updateTipoTrabajo,
  deleteTipoTrabajo,
} from "@/lib/api";

export default function TiposTrabajoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tipos, setTipos] = useState<any[]>([]);
  const [filteredTipos, setFilteredTipos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    requiere_repuestos: false,
  });
  const [formError, setFormError] = useState("");

  // Protección: solo admin
  useEffect(() => {
    if (user && user.rol !== "admin") {
      router.push("/dashboard");
    } else if (user) {
      loadTipos();
    }
  }, [user, router]);

  useEffect(() => {
    const filtered = tipos.filter((tipo) =>
      tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredTipos(filtered);
  }, [searchTerm, tipos]);

  async function loadTipos() {
    try {
      const data = await getTiposTrabajo();
      setTipos(data);
    } catch (error) {
      console.error("Error loading:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenDialog = (tipo?: Record<string, unknown>) => {
    setFormError("");
    if (tipo) {
      setEditingTipo(tipo);
      setFormData({
        nombre: (tipo as any).nombre,
        descripcion: (tipo as any).descripcion || "",
        requiere_repuestos: (tipo as any).requiere_repuestos || false,
      });
    } else {
      setEditingTipo(null);
      setFormData({ nombre: "", descripcion: "", requiere_repuestos: false });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError("");
    if (!formData.nombre.trim()) {
      setFormError("El nombre es requerido");
      return;
    }

    setIsSaving(true);
    try {
      if (editingTipo) {
        await updateTipoTrabajo(
          editingTipo.id,
          formData.nombre,
          formData.descripcion,
          formData.requiere_repuestos,
        );
      } else {
        await createTipoTrabajo(
          formData.nombre,
          formData.descripcion,
          formData.requiere_repuestos,
        );
      }

      setIsDialogOpen(false);
      setFormData({ nombre: "", descripcion: "", requiere_repuestos: false });
      setFormError("");
      await loadTipos();
    } catch (error) {
      console.error("Error:", error);
      setFormError("Error al guardar. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este tipo de trabajo?")) {
      try {
        await deleteTipoTrabajo(id);
        await loadTipos();
      } catch (error) {
        console.error("Error:", error);
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
          <h1 className="text-2xl font-bold text-foreground">
            Tipos de Trabajo
          </h1>
          <p className="text-muted-foreground">
            Gestiona los tipos de trabajos (preventivo, correctivo, etc)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTipo
                  ? "Editar Tipo de Trabajo"
                  : "Nuevo Tipo de Trabajo"}
              </DialogTitle>
              <DialogDescription>
                {editingTipo
                  ? "Actualiza los datos del tipo de trabajo"
                  : "Crea un nuevo tipo de trabajo"}
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
                  <FieldLabel htmlFor="nombre">Nombre *</FieldLabel>
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
                  <FieldLabel htmlFor="descripcion">Descripción</FieldLabel>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    disabled={isSaving}
                    placeholder="Ej: Revisión y limpieza periódica"
                  />
                </Field>
                <div className="flex items-center justify-between">
                  <FieldLabel
                    htmlFor="requiere_repuestos"
                    className="text-base">
                    ¿Requiere Repuestos?
                  </FieldLabel>
                  <Switch
                    id="requiere_repuestos"
                    checked={formData.requiere_repuestos}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiere_repuestos: checked })
                    }
                    disabled={isSaving}
                  />
                </div>
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
                  ) : editingTipo ? (
                    "Guardar Cambios"
                  ) : (
                    "Crear Tipo"
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
          placeholder="Buscar tipos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Tipos</CardTitle>
          <CardDescription>
            {filteredTipos.length} tipos de trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Requiere Repuestos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTipos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8">
                    Sin tipos de trabajo registrados
                  </TableCell>
                </TableRow>
              ) : (
                filteredTipos.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-primary" />
                        <span className="font-medium">{tipo.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {tipo.descripcion || "-"}
                    </TableCell>
                    <TableCell>
                      {tipo.requiere_repuestos ? (
                        <Badge className="bg-blue-500/10 text-blue-600">
                          Sí
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/10 text-gray-600">
                          No
                        </Badge>
                      )}
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
                            onClick={() => handleOpenDialog(tipo)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(tipo.id)}
                            className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
