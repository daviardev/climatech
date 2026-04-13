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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Check, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  getRepuestosEnRevision,
  aprobarRepuestoEnRevision,
  rechazarRepuestoEnRevision,
  getClientes,
} from "@/lib/api";

export default function RepuestosRevisionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [filteredRepuestos, setFilteredRepuestos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState<any[]>([]);

  // Dialog for reject reason
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Protección: solo admin
  useEffect(() => {
    if (user && user.rol !== "admin") {
      router.push("/dashboard");
    } else if (user) {
      loadData();
    }
  }, [user, router]);

  useEffect(() => {
    const filtered = repuestos.filter(
      (rep) =>
        rep.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rep.descripcion &&
          rep.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
    );
    setFilteredRepuestos(filtered);
  }, [searchTerm, repuestos]);

  async function loadData() {
    try {
      const [repuestosData, clientesData] = await Promise.all([
        getRepuestosEnRevision(),
        getClientes(),
      ]);
      setRepuestos(repuestosData);
      setClientes(clientesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const getClienteName = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente ? cliente.nombre_empresa || cliente.nombre : "Sin cliente";
  };

  const handleApprove = async (repuestoId: string) => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      await aprobarRepuestoEnRevision(repuestoId, user.id);
      await loadData();
    } catch (error) {
      console.error("Error approving:", error);
      alert("Error al aprobar repuesto");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (repuestoId: string) => {
    setRejectingId(repuestoId);
    setRejectReason("");
    setRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId || !rejectReason.trim()) return;

    setIsProcessing(true);
    try {
      await rechazarRepuestoEnRevision(rejectingId, rejectReason);
      setRejectDialog(false);
      setRejectingId(null);
      setRejectReason("");
      await loadData();
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("Error al rechazar repuesto");
    } finally {
      setIsProcessing(false);
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
            Repuestos en Revisión
          </h1>
          <p className="text-muted-foreground">
            Aprueba o rechaza las solicitudes de repuestos de clientes
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Pendientes</CardTitle>
          <CardDescription>
            {filteredRepuestos.length} solicitud
            {filteredRepuestos.length !== 1 ? "es" : ""} en espera
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRepuestos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {repuestos.length === 0
                ? "No hay solicitudes de repuestos en revisión"
                : "No se encontraron resultados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Repuesto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">
                      Precio Estimado
                    </TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-12">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRepuestos.map((repuesto) => (
                    <TableRow key={repuesto.id}>
                      <TableCell className="font-medium">
                        {repuesto.nombre}
                      </TableCell>
                      <TableCell>
                        {getClienteName(repuesto.cliente_id)}
                      </TableCell>
                      <TableCell className="text-right">
                        {repuesto.cantidad_solicitada}
                      </TableCell>
                      <TableCell className="text-right">
                        ${repuesto.precio_estimado?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {repuesto.descripcion
                          ? repuesto.descripcion.substring(0, 40)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleApprove(repuesto.id)}
                              disabled={isProcessing}
                              className="text-green-600">
                              <Check className="mr-2 h-4 w-4" />
                              Aprobar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRejectClick(repuesto.id)}
                              disabled={isProcessing}
                              className="text-red-600">
                              <X className="mr-2 h-4 w-4" />
                              Rechazar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Proporciona una razón para rechazar este repuesto
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ej: Repuesto no disponible en este proveedor"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-24"
            disabled={isProcessing}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog(false)}
              disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || isProcessing}>
              {isProcessing ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
