"use client";
import { LoginForm } from "@/components/LoginForm";
import { Sunset } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      router.push('/');
    } catch (error) {
      // L'erreur est déjà gérée dans le composant LoginForm
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center mb-8">
        <Sunset className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">Planificateur de Vacances</h1>
      </div>
      <div className="w-full max-w-md px-4">
        <LoginForm onLogin={handleLogin} />
      </div>
    </div>
  );
} 