"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Snowflake, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      router.push("/dashboard");
    } else {
      setError("Credenciales incorrectas. Intenta de nuevo.");
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Snowflake className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">ClimaTech</h1>
          </div>
          <p className="text-muted-foreground text-center">
            Sistema de Gestión de Mantenimiento de Climatización
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </Field>
              </FieldGroup>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm mt-4 p-3 bg-destructive/10 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-6 h-11"
                disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">
                Credenciales de prueba:
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium">Admin:</span>{" "}
                  admin@climatech.com / admin123
                </p>
                <p>
                  <span className="font-medium">Técnico:</span>{" "}
                  carlos@climatech.com / tecnico123
                </p>
                <p>
                  <span className="font-medium">Cliente:</span>{" "}
                  contacto@empresaabc.com / cliente123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Proyecto Final - Desarrollo Web ADSO SENA
        </p>
      </div>
    </div>
  );
}
