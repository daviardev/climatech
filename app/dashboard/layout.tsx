"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Snowflake,
  LayoutDashboard,
  Users,
  Wrench,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Building2,
  Thermometer,
  Menu,
  X,
  Tag,
  PackageCheck,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { updateNombreUsuario, updatePasswordUsuario } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ("admin" | "tecnico" | "cliente")[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "tecnico", "cliente"],
  },
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    icon: Building2,
    roles: ["admin"],
  },
  {
    href: "/dashboard/tecnicos",
    label: "Técnicos",
    icon: Users,
    roles: ["admin"],
  },
  {
    href: "/dashboard/usuarios",
    label: "Usuarios",
    icon: User,
    roles: ["admin"],
  },
  {
    href: "/dashboard/equipos",
    label: "Equipos",
    icon: Thermometer,
    roles: ["admin"],
  },
  {
    href: "/dashboard/tipos-equipo",
    label: "Tipos de Equipo",
    icon: Tag,
    roles: ["admin"],
  },
  {
    href: "/dashboard/tipos-trabajo",
    label: "Tipos de Trabajo",
    icon: Wrench,
    roles: ["admin"],
  },
  {
    href: "/dashboard/repuestos-revision",
    label: "Repuestos en Revisión",
    icon: PackageCheck,
    roles: ["admin"],
  },
  {
    href: "/dashboard/ordenes",
    label: "Órdenes de Trabajo",
    icon: ClipboardList,
    roles: ["admin", "tecnico", "cliente"],
  },
  {
    href: "/dashboard/cotizaciones-admin",
    label: "Cotizaciones (Admin)",
    icon: FileText,
    roles: ["admin"],
  },
  {
    href: "/dashboard/solicitar-cotizacion",
    label: "Solicitar Cotización",
    icon: MessageSquare,
    roles: ["cliente"],
  },
  {
    href: "/dashboard/mis-cotizaciones",
    label: "Mis Cotizaciones",
    icon: CheckCircle,
    roles: ["cliente"],
  },
  {
    href: "/dashboard/repuestos",
    label: "Repuestos",
    icon: Wrench,
    roles: ["admin", "tecnico"],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configFormData, setConfigFormData] = useState({
    nombre: "",
    passwordActual: "",
    passwordNueva: "",
    passwordConfirm: "",
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.rol),
  );

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleOpenConfig = () => {
    if (user) {
      setConfigFormData({
        nombre: user.nombre,
        passwordActual: "",
        passwordNueva: "",
        passwordConfirm: "",
      });
      setConfigError("");
      setConfigDialogOpen(true);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError("");
    setConfigLoading(true);

    try {
      // Validaciones
      if (configFormData.nombre.trim().length === 0) {
        throw new Error("El nombre no puede estar vacío");
      }

      // Actualizar nombre si cambió
      if (configFormData.nombre !== user?.nombre) {
        await updateNombreUsuario(user!.id, configFormData.nombre);
      }

      // Actualizar contraseña si se proporcionó
      if (configFormData.passwordNueva) {
        if (configFormData.passwordNueva.length < 6) {
          throw new Error("La nueva contraseña debe tener mínimo 6 caracteres");
        }
        if (configFormData.passwordNueva !== configFormData.passwordConfirm) {
          throw new Error("Las contraseñas no coinciden");
        }
        await updatePasswordUsuario(user!.id, configFormData.passwordNueva);
      }

      setConfigDialogOpen(false);
      setConfigFormData({
        nombre: "",
        passwordActual: "",
        passwordNueva: "",
        passwordConfirm: "",
      });
      // Podrías mostrar un toast de éxito aquí
      alert("Configuración actualizada correctamente");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar configuración";
      setConfigError(errorMessage);
    } finally {
      setConfigLoading(false);
    }
  };

  const getRolLabel = (rol: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      tecnico: "Técnico",
      cliente: "Cliente",
    };
    return labels[rol] || rol;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-4 overflow-y-auto bg-sidebar border-r border-sidebar-border px-4 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Snowflake className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">
              ClimaTech
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-1">
              {filteredNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}>
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User menu */}
          <div className="border-t border-sidebar-border pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-sidebar-accent/50 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
                    <User className="h-5 w-5 text-sidebar-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user.nombre}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60">
                      {getRolLabel(user.rol)}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleOpenConfig}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center gap-4 border-b border-border bg-background px-4 py-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Snowflake className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">ClimaTech</span>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                  <Snowflake className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>
                <span className="font-semibold text-sidebar-foreground">
                  ClimaTech
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5 text-sidebar-foreground" />
              </Button>
            </div>
            <nav className="flex flex-col gap-1">
              {filteredNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}>
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="p-4 lg:p-8">{children}</div>
      </main>

      {/* Dialog de Configuración */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configuración de Cuenta</DialogTitle>
            <DialogDescription>
              Cambia tu nombre de usuario o contraseña
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveConfig}>
            {configError && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {configError}
              </div>
            )}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
                <Input
                  id="nombre"
                  value={configFormData.nombre}
                  onChange={(e) =>
                    setConfigFormData({
                      ...configFormData,
                      nombre: e.target.value,
                    })
                  }
                  disabled={configLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="passwordNueva">
                  Nueva Contraseña (opcional)
                </FieldLabel>
                <Input
                  id="passwordNueva"
                  type="password"
                  value={configFormData.passwordNueva}
                  onChange={(e) =>
                    setConfigFormData({
                      ...configFormData,
                      passwordNueva: e.target.value,
                    })
                  }
                  disabled={configLoading}
                  placeholder="Dejar en blanco para no cambiar"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="passwordConfirm">
                  Confirmar Contraseña
                </FieldLabel>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={configFormData.passwordConfirm}
                  onChange={(e) =>
                    setConfigFormData({
                      ...configFormData,
                      passwordConfirm: e.target.value,
                    })
                  }
                  disabled={configLoading}
                  placeholder="Confirma tu nueva contraseña"
                />
              </Field>
            </FieldGroup>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfigDialogOpen(false)}
                disabled={configLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={configLoading}>
                {configLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
