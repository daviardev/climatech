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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRepuestos, createRepuesto, formatCurrency } from "@/lib/api";
import type { Repuesto } from "@/lib/types";
import {
  Plus,
  Search,
  Wrench,
  Package,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function RepuestosPage() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [filteredRepuestos, setFilteredRepuestos] = useState<Repuesto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    costo: 0,
    stock: 0,
  });

  useEffect(() => {
    loadRepuestos();
  }, []);

  useEffect(() => {
    const filtered = repuestos.filter((repuesto) =>
      repuesto.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredRepuestos(filtered);
  }, [searchTerm, repuestos]);

  async function loadRepuestos() {
    try {
      const data = await getRepuestos();
      setRepuestos(data);
      setFilteredRepuestos(data);
    } catch (error) {
      console.error("Error loading repuestos:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRepuesto(formData);
      await loadRepuestos();
      setIsDialogOpen(false);
      setFormData({ nombre: "", costo: 0, stock: 0 });
    } catch (error) {
      console.error("Error saving repuesto:", error);
    }
  };

  const totalInventario = repuestos.reduce(
    (sum, r) => sum + r.costo * r.stock,
    0,
  );
  const repuestosStockBajo = repuestos.filter((r) => r.stock < 10);

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
          <h1 className="text-2xl font-bold text-foreground">Repuestos</h1>
          <p className="text-muted-foreground">
            Inventario de repuestos y materiales
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Repuesto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Repuesto</DialogTitle>
              <DialogDescription>
                Registra un nuevo repuesto en el inventario
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="nombre">Nombre del Repuesto</FieldLabel>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    placeholder="Ej: Filtro de aire estándar"
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="costo">Costo (COP)</FieldLabel>
                    <Input
                      id="costo"
                      type="number"
                      value={formData.costo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          costo: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="stock">Stock Inicial</FieldLabel>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      required
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
                <Button type="submit">Crear Repuesto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Repuestos
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {repuestos.length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Unidades en Stock
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {repuestos.reduce((sum, r) => sum + r.stock, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Valor Inventario
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(totalInventario)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Stock Bajo
                </p>
                <p className="text-3xl font-bold text-warning">
                  {repuestosStockBajo.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar repuestos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventario de Repuestos</CardTitle>
          <CardDescription>
            {filteredRepuestos.length} repuestos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repuesto</TableHead>
                <TableHead>Costo Unitario</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRepuestos.map((repuesto) => (
                <TableRow key={repuesto.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {repuesto.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {repuesto.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {formatCurrency(repuesto.costo)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        repuesto.stock < 10
                          ? "bg-warning/10 text-warning-foreground border-warning/30"
                          : "bg-success/10 text-success border-success/30"
                      }>
                      {repuesto.stock} unidades
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-muted-foreground">
                      {formatCurrency(repuesto.costo * repuesto.stock)}
                    </span>
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
