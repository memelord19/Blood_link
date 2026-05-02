import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BloodLinkLogo } from "@/components/BloodLinkLogo";
import { useAuth, getDashboardPath } from "@/lib/auth-context";
import { useLogin } from "@workspace/api-client-react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { label: "Donneur", email: "ahmed.ben@demo.tn", password: "demo123", color: "bg-red-100 text-red-700 border-red-200" },
  { label: "Centre de transfusion", email: "centre@cnts.tn", password: "demo123", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Banque de sang", email: "banque@blood.tn", password: "demo123", color: "bg-teal-100 text-teal-700 border-teal-200" },
  { label: "Clinique", email: "clinique@sante.tn", password: "demo123", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await loginMutation.mutateAsync({ data: { email: data.email, password: data.password } });
      login(result.user as any, result.token);
      toast.success(`Bienvenue, ${result.user.firstName} !`);
      navigate(getDashboardPath(result.user.role));
    } catch (err: any) {
      toast.error("Identifiants invalides. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary p-8 text-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-2">
              <BloodLinkLogo className="w-10 h-10" />
              <span className="text-2xl font-black text-white">BloodLink</span>
            </Link>
            <p className="text-white/80 text-sm mt-2">Connexion à votre espace</p>
          </div>

          <div className="p-8">
            {/* Demo accounts */}
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Comptes de démonstration</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map(acc => (
                  <button key={acc.email} onClick={() => { setValue("email", acc.email); setValue("password", acc.password); }}
                    className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80 ${acc.color}`}>
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input id="email" type="email" {...register("email")} placeholder="votre@email.com" className="mt-1.5" />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
                <div className="relative mt-1.5">
                  <Input id="password" type={showPassword ? "text" : "password"} {...register("password")} placeholder="••••••••" className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div className="flex justify-end">
                <a href="#" className="text-xs text-primary hover:underline">Mot de passe oublié ?</a>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connexion...</span>
                ) : (
                  <span className="flex items-center gap-2"><LogIn className="w-4 h-4" />Se connecter</span>
                )}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Nouveau donneur ?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">S'inscrire</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
