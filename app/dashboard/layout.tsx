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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

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
    href: "/dashboard/ordenes",
    label: "Órdenes de Trabajo",
    icon: ClipboardList,
    roles: ["admin", "tecnico", "cliente"],
  },
  {
    href: "/dashboard/cotizaciones",
    label: "Cotizaciones",
    icon: FileText,
    roles: ["admin", "cliente"],
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
                <DropdownMenuItem>
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
    </div>
  );
}
