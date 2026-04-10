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
import { Badge } from "@/components/ui/badge";
import {
  getDashboardStats,
  getOrdenes,
  getOrdenesByTecnicoId,
  getOrdenesByClienteId,
  getTecnicoByUsuarioId,
  getClienteByUsuarioId,
  formatCurrency,
  formatDate,
  getEstadoColor,
  getPrioridadColor,
} from "@/lib/api";
import type {
  DashboardStats,
  OrdenTrabajoExtendida,
  Tecnico,
  Cliente,
} from "@/lib/types";
import {
  ClipboardList,
  Users,
  Building2,
  TrendingUp,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ordenes, setOrdenes] = useState<OrdenTrabajoExtendida[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tecnico, setTecnico] = useState<Tecnico | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const statsData = await getDashboardStats();
        setStats(statsData);

        if (user.rol === "admin") {
          const ordenesData = await getOrdenes();
          setOrdenes(ordenesData.slice(0, 5));
        } else if (user.rol === "tecnico") {
          const tecnicoData = await getTecnicoByUsuarioId(user.id);
          if (tecnicoData) {
            setTecnico(tecnicoData);
            const ordenesData = await getOrdenesByTecnicoId(tecnicoData.id);
            setOrdenes(ordenesData);
          }
        } else if (user.rol === "cliente") {
          const clienteData = await getClienteByUsuarioId(user.id);
          if (clienteData) {
            setCliente(clienteData);
            const ordenesData = await getOrdenesByClienteId(clienteData.id);
            setOrdenes(ordenesData);
          }
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  // Chart data for admin
  const ordenesChartData = [
    {
      name: "Pendientes",
      value: stats.ordenesPendientes,
      color: "hsl(var(--warning))",
    },
    {
      name: "En Progreso",
      value:
        stats.totalOrdenes - stats.ordenesPendientes - stats.ordenesCompletadas,
      color: "hsl(var(--primary))",
    },
    {
      name: "Completadas",
      value: stats.ordenesCompletadas,
      color: "hsl(var(--success))",
    },
  ];

  const mantenimientosChartData = [
    { name: "Preventivos", cantidad: stats.mantenimientosPreventivos },
    { name: "Correctivos", cantidad: stats.mantenimientosCorrectivos },
  ];

  const COLORS = [
    "oklch(0.7 0.15 80)",
    "oklch(0.45 0.15 250)",
    "oklch(0.55 0.18 145)",
  ];

  // Render different dashboards based on role
  if (user?.rol === "admin") {
    return (
      <AdminDashboard
        stats={stats}
        ordenes={ordenes}
        ordenesChartData={ordenesChartData}
        mantenimientosChartData={mantenimientosChartData}
        COLORS={COLORS}
      />
    );
  }

  if (user?.rol === "tecnico") {
    return <TecnicoDashboard ordenes={ordenes} tecnico={tecnico} />;
  }

  if (user?.rol === "cliente") {
    return <ClienteDashboard ordenes={ordenes} cliente={cliente} />;
  }

  return null;
}

// Admin Dashboard Component
function AdminDashboard({
  stats,
  ordenes,
  ordenesChartData,
  mantenimientosChartData,
  COLORS,
}: {
  stats: DashboardStats;
  ordenes: OrdenTrabajoExtendida[];
  ordenesChartData: { name: string; value: number; color: string }[];
  mantenimientosChartData: { name: string; cantidad: number }[];
  COLORS: string[];
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Órdenes
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalOrdenes}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <span className="text-warning">
                {stats.ordenesPendientes} pendientes
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Clientes
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalClientes}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-accent" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-success" />
              Clientes activos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Técnicos
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalTecnicos}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <Wrench className="h-4 w-4" />
              Personal disponible
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ingresos del Mes
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.ingresosMes)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              Cotizaciones aprobadas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado de Órdenes</CardTitle>
            <CardDescription>Distribución por estado actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordenesChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value">
                    {ordenesChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Mantenimiento</CardTitle>
            <CardDescription>Preventivos vs Correctivos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mantenimientosChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip />
                  <Bar
                    dataKey="cantidad"
                    fill="oklch(0.45 0.15 250)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Órdenes Recientes</CardTitle>
            <CardDescription>
              Últimas órdenes de trabajo registradas
            </CardDescription>
          </div>
          <Link href="/dashboard/ordenes">
            <Button variant="outline" size="sm">
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ordenes.map((orden) => (
              <div
                key={orden.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      orden.estado === "completada"
                        ? "bg-success/10"
                        : orden.estado === "pendiente"
                          ? "bg-warning/10"
                          : "bg-primary/10"
                    }`}>
                    {orden.estado === "completada" ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : orden.estado === "pendiente" ? (
                      <Clock className="h-5 w-5 text-warning" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {orden.descripcion}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {orden.cliente?.nombre} - {orden.equipo?.tipo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={getEstadoColor(orden.estado)}>
                    {orden.estado.replace("_", " ")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getPrioridadColor(orden.prioridad)}>
                    {orden.prioridad}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(orden.fecha)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Tecnico Dashboard Component
function TecnicoDashboard({
  ordenes,
  tecnico,
}: {
  ordenes: OrdenTrabajoExtendida[];
  tecnico: Tecnico | null;
}) {
  const ordenesActivas = ordenes.filter(
    (o) => o.estado !== "completada" && o.estado !== "cancelada",
  );
  const ordenesCompletadas = ordenes.filter((o) => o.estado === "completada");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenido, {tecnico?.nombre || "Técnico"}
        </h1>
        <p className="text-muted-foreground">Panel de órdenes asignadas</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Órdenes Activas
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {ordenesActivas.length}
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
                  Completadas
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {ordenesCompletadas.length}
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
                  Especialidad
                </p>
                <p className="text-lg font-medium text-foreground">
                  {tecnico?.especialidad || "-"}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Órdenes de Trabajo</CardTitle>
          <CardDescription>
            Órdenes asignadas pendientes de completar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordenesActivas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tienes órdenes asignadas actualmente
            </p>
          ) : (
            <div className="space-y-4">
              {ordenesActivas.map((orden) => (
                <div
                  key={orden.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">
                      {orden.descripcion}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {orden.cliente?.nombre} - {orden.equipo?.marca}{" "}
                      {orden.equipo?.modelo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {orden.cliente?.direccion}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={getEstadoColor(orden.estado)}>
                      {orden.estado.replace("_", " ")}
                    </Badge>
                    <Link href={`/dashboard/ordenes/${orden.id}`}>
                      <Button size="sm">Ver detalles</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Cliente Dashboard Component
function ClienteDashboard({
  ordenes,
  cliente,
}: {
  ordenes: OrdenTrabajoExtendida[];
  cliente: Cliente | null;
}) {
  const ordenesActivas = ordenes.filter(
    (o) => o.estado !== "completada" && o.estado !== "cancelada",
  );
  const ordenesCompletadas = ordenes.filter((o) => o.estado === "completada");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenido, {cliente?.nombre || "Cliente"}
        </h1>
        <p className="text-muted-foreground">
          Panel de seguimiento de servicios
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Servicios en Proceso
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {ordenesActivas.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Servicios Completados
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {ordenesCompletadas.length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Service Button */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">
                ¿Necesitas un servicio?
              </h3>
              <p className="text-sm text-muted-foreground">
                Solicita mantenimiento para tus equipos
              </p>
            </div>
            <Link href="/dashboard/ordenes/nueva">
              <Button>Solicitar Servicio</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Servicios</CardTitle>
          <CardDescription>
            Historial de órdenes de mantenimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordenes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tienes servicios registrados
            </p>
          ) : (
            <div className="space-y-4">
              {ordenes.map((orden) => (
                <div
                  key={orden.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">
                      {orden.descripcion}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {orden.equipo?.tipo} - {orden.equipo?.marca}{" "}
                      {orden.equipo?.modelo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {orden.tecnico
                        ? `Técnico: ${orden.tecnico.nombre}`
                        : "Pendiente de asignar técnico"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={getEstadoColor(orden.estado)}>
                      {orden.estado.replace("_", " ")}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(orden.fecha)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
