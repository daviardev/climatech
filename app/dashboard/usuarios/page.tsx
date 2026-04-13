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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getUsuarios, createUsuario, deleteUsuario } from "@/lib/api";
import type { User } from "@/lib/types";
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

export default function UsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "cliente",
  });
  const [formError, setFormError] = useState("");

  // Protección: solo admin
  useEffect(() => {
    if (user && user.rol !== "admin") {
      router.push("/dashboard");
    } else if (user) {
      loadUsuarios();
    }
  }, [user, router]);

  useEffect(() => {
    const filtered = usuarios.filter(
      (usuario) =>
        usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredUsuarios(filtered);
  }, [searchTerm, usuarios]);

  async function loadUsuarios() {
    try {
      const data = await getUsuarios();
      setUsuarios(data);
      setFilteredUsuarios(data);
    } catch (error) {
      console.error("Error loading usuarios:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenDialog = () => {
    setFormError("");
    setFormData({ nombre: "", email: "", rol: "cliente" });
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
    if (!formData.email.trim()) {
      setFormError("El email es requerido");
      return;
    }
    if (!formData.email.includes("@")) {
      setFormError("Email inválido");
      return;
    }
    if (!formData.rol) {
      setFormError("Debes seleccionar un rol");
      return;
    }

    setIsSaving(true);
    try {
      await createUsuario(formData.nombre, formData.email, formData.rol);
      await loadUsuarios();
      setIsDialogOpen(false);
      setFormData({ nombre: "", email: "", rol: "cliente" });
      setFormError("");
      setFormData({ nombre: "", email: "", rol: "cliente" });
    } catch (error) {
      console.error("Error saving usuario:", error);
      if (error instanceof Error && error.message?.includes("duplicate")) {
        setFormError("Este email ya está registrado");
      } else {
        setFormError("Error al crear usuario. Intenta de nuevo.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUsuario = async () => {
    if (!usuarioToDelete) return;

    setIsDeleting(true);
    try {
      await deleteUsuario(usuarioToDelete.id);
      await loadUsuarios();
      setUsuarioToDelete(null);
    } catch (error) {
      console.error("Error deleting usuario:", error);
      alert("Error al eliminar usuario. Intenta de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case "admin":
        return "bg-destructive/10 text-destructive";
      case "tecnico":
        return "bg-blue-500/10 text-blue-600";
      case "cliente":
        return "bg-green-500/10 text-green-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case "admin":
        return "Administrador";
      case "tecnico":
        return "Técnico";
      case "cliente":
        return "Cliente";
      default:
        return rol;
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
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestión de usuarios del sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa los datos. La contraseña se genera automáticamente y se
                enviará por email al usuario.
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
                  <FieldLabel htmlFor="email">Email *</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={isSaving}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="rol">Rol *</FieldLabel>
                  <Select
                    value={formData.rol}
                    onValueChange={(value) =>
                      setFormData({ ...formData, rol: value })
                    }
                    disabled={isSaving}>
                    <SelectTrigger id="rol">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
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
                      Creando...
                    </>
                  ) : (
                    "Crear Usuario"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog
        open={!!usuarioToDelete}
        onOpenChange={(open) => {
          if (!open) setUsuarioToDelete(null);
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar a{" "}
              <strong>{usuarioToDelete?.nombre}</strong>? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
            <p>
              <strong>⚠️ Advertencia:</strong> Se eliminarán todos los datos
              asociados a este usuario, incluyendo órdenes y registros.
            </p>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUsuarioToDelete(null)}
              disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUsuario}
              disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Usuario"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Usuarios</CardTitle>
          <CardDescription>
            {filteredUsuarios.length} usuarios registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {usuario.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {usuario.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.email}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRolColor(usuario.rol)}>
                      {getRolLabel(usuario.rol)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {usuario.id !== user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive cursor-pointer"
                            onClick={() => setUsuarioToDelete(usuario)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
