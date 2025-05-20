"use client";
import { useState } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { signUp } from "@/lib/supabase";
import Link from "next/link";
import { Sunset } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/lib/auth-context';

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await signUp(email, password, username);
      await login(email, password);
      toast({
        title: 'Inscription réussie',
        description: `Bienvenue ${username} ! Vous pouvez maintenant vous connecter.`,
      });
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de l\'inscription. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center mb-8">
        <Sunset className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">Planificateur de Vacances</h1>
      </div>
      <div className="w-full max-w-md p-8 bg-card rounded-xl shadow text-card-foreground">
        <h2 className="text-2xl font-bold mb-4 text-center text-primary">Inscription</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <label className="block text-sm font-medium text-primary">Nom d'utilisateur</label>
          <input
            type="text"
            placeholder="Entrez votre nom d'utilisateur"
            className="w-full border rounded px-3 py-2 bg-background text-foreground border-border"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <label className="block text-sm font-medium text-primary">Email</label>
          <input
            type="email"
            placeholder="Entrez votre email"
            className="w-full border rounded px-3 py-2 bg-background text-foreground border-border"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <label className="block text-sm font-medium text-primary">Mot de passe</label>
          <input
            type="password"
            placeholder="Entrez votre mot de passe"
            className="w-full border rounded px-3 py-2 bg-background text-foreground border-border"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <PrimaryButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Inscription..." : "S'inscrire"}
          </PrimaryButton>
        </form>
        <div className="flex flex-row items-center justify-center gap-4 mt-6 text-sm">
          <span className="text-primary">Déjà un compte ? <Link href="/" className="underline">Se connecter</Link></span>
          <span className="text-primary">|</span>
          <Link href="/reset-password" className="text-primary underline">Mot de passe oublié ?</Link>
        </div>
      </div>
    </div>
  );
} 