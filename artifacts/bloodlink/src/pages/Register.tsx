import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckSquare, UserPlus, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BloodLinkLogo } from "@/components/BloodLinkLogo";
import { useAuth, getDashboardPath } from "@/lib/auth-context";
import { useRegister } from "@workspace/api-client-react";
import { toast } from "sonner";

const TUNISIAN_REGIONS = ["Tunis", "Ariana", "Ben Arous", "Manouba", "Sfax", "Sousse", "Nabeul", "Bizerte", "Monastir", "Gabès", "Médenine", "Kasserine", "Kairouan", "Gafsa", "Tozeur", "Kebili", "Tataouine", "Jendouba", "Kef", "Siliana", "Zaghouan", "Mahdia", "Sidi Bouzid", "Béja"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const CHARTER_TEXT = `CHARTE DU DONNEUR — PLATEFORME BLOODLINK

En tant que donneur de sang volontaire sur la plateforme BloodLink, je m'engage à :

1. Fournir des informations exactes et complètes sur mon état de santé lors de chaque don.
2. Signaler tout problème de santé survenu après un don dans les 24 heures.
3. Respecter les délais minimaux entre les dons (56 jours minimum).
4. Ne pas donner mon sang si je me sens dans un état de santé altéré.
5. Informer le personnel médical de tout médicament en cours.
6. Respecter les critères d'exclusion temporaire et définitive définis par les autorités sanitaires tunisiennes.
7. Maintenir mes coordonnées à jour sur la plateforme.
8. Comprendre que mon sang sera utilisé pour des soins médicaux et des transfusions vitales.

La plateforme BloodLink s'engage à :
• Protéger vos données personnelles conformément à la législation tunisienne.
• Vous informer de l'état de vos dons et de votre éligibilité.
• Garantir la traçabilité et la sécurité du processus de don.
• Vous notifier en cas de besoin urgent de votre groupe sanguin.`;

const schema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  cin: z.string().min(8, "CIN invalide").max(8, "CIN invalide"),
  dateOfBirth: z.string().min(1, "Date de naissance requise"),
  gender: z.string().min(1, "Genre requis"),
  weight: z.string().min(1, "Poids requis"),
  phone: z.string().min(8, "Téléphone requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  region: z.string().min(1, "Région requise"),
  bloodType: z.string().min(1, "Groupe sanguin requis"),
});

type FormData = z.infer<typeof schema>;

function computeAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default function Register() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [charterAccepted, setCharterAccepted] = useState(false);
  const [charterScrolled, setCharterScrolled] = useState(false);
  const registerMutation = useRegister();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const dobValue = watch("dateOfBirth");
  const weightValue = watch("weight");
  const genderValue = watch("gender");

  const age = computeAge(dobValue);
  const weight = parseFloat(weightValue) || 0;
  const isTooYoung = dobValue && age < 18;
  const isTooOld = dobValue && age > 65;
  const isTooLight = weightValue && weight < 50;
  const isPregnancyRisk = genderValue === "female";
  const isIneligible = isTooYoung || isTooOld || isTooLight;

  const onSubmit = async (data: FormData) => {
    if (!charterAccepted) {
      toast.error("Vous devez accepter la charte du donneur.");
      return;
    }
    try {
      const result = await registerMutation.mutateAsync({ data: { ...data, weight: parseFloat(data.weight) as any, acceptedCharter: true } });
      login(result.user as any, result.token);
      toast.success("Inscription réussie ! Bienvenue sur BloodLink.");
      navigate("/donor/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'inscription.");
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) setCharterScrolled(true);
  };

  return (
    <div className="min-h-screen bg-sidebar py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-primary p-8 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <BloodLinkLogo className="w-9 h-9" />
              <span className="text-2xl font-black text-white">BloodLink</span>
            </Link>
            <p className="text-white/80 text-sm mt-2">Inscription Donneur</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
            {/* Eligibility info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Critères d'éligibilité au don de sang</p>
                <ul className="text-xs space-y-0.5 text-blue-700 list-disc list-inside">
                  <li>Âge compris entre 18 et 65 ans</li>
                  <li>Poids supérieur ou égal à 50 kg</li>
                  <li>Pas de grossesse en cours (pour les femmes)</li>
                  <li>Délai de 56 jours minimum entre deux dons</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Prénom *</Label>
                <Input {...register("firstName")} placeholder="Ahmed" className="mt-1.5" />
                {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium">Nom *</Label>
                <Input {...register("lastName")} placeholder="Ben Ali" className="mt-1.5" />
                {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">CIN (8 chiffres) *</Label>
                <Input {...register("cin")} placeholder="12345678" maxLength={8} className="mt-1.5" />
                {errors.cin && <p className="text-destructive text-xs mt-1">{errors.cin.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium">Date de naissance *</Label>
                <Input type="date" {...register("dateOfBirth")} className="mt-1.5" />
                {errors.dateOfBirth && <p className="text-destructive text-xs mt-1">{errors.dateOfBirth.message}</p>}
                {isTooYoung && (
                  <p className="text-orange-600 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Vous devez avoir au moins 18 ans pour donner votre sang.
                  </p>
                )}
                {isTooOld && (
                  <p className="text-orange-600 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Le don de sang n'est pas recommandé après 65 ans.
                  </p>
                )}
                {dobValue && !isTooYoung && !isTooOld && age > 0 && (
                  <p className="text-green-600 text-xs mt-1">Âge : {age} ans ✓</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Genre *</Label>
                <Select onValueChange={(v) => setValue("gender", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Genre" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Homme</SelectItem>
                    <SelectItem value="female">Femme</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-destructive text-xs mt-1">{errors.gender.message}</p>}
                {isPregnancyRisk && (
                  <p className="text-blue-600 text-xs mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Quota : 3 dons/an max pour les femmes.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Poids (kg) *</Label>
                <Input type="number" {...register("weight")} placeholder="70" min="1" className="mt-1.5" />
                {errors.weight && <p className="text-destructive text-xs mt-1">{errors.weight.message}</p>}
                {isTooLight && (
                  <p className="text-orange-600 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Poids minimum requis : 50 kg.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Groupe sanguin *</Label>
                <Select onValueChange={(v) => setValue("bloodType", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Groupe" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.bloodType && <p className="text-destructive text-xs mt-1">{errors.bloodType.message}</p>}
              </div>
            </div>

            {/* Ineligibility warning */}
            {isIneligible && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-900">⚠ Vous ne remplissez pas encore les critères d'éligibilité</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Vous pouvez tout de même créer votre compte. Votre statut sera réévalué lors de votre formulaire médical.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Téléphone *</Label>
                <Input {...register("phone")} placeholder="20123456" className="mt-1.5" />
                {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium">Région *</Label>
                <Select onValueChange={(v) => setValue("region", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Région" /></SelectTrigger>
                  <SelectContent>
                    {TUNISIAN_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.region && <p className="text-destructive text-xs mt-1">{errors.region.message}</p>}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Email *</Label>
              <Input type="email" {...register("email")} placeholder="votre@email.com" className="mt-1.5" />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label className="text-sm font-medium">Mot de passe *</Label>
              <Input type="password" {...register("password")} placeholder="8 caractères minimum" className="mt-1.5" />
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Charter */}
            <div className="bg-muted rounded-xl p-4 border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                Charte du donneur BloodLink *
              </h3>
              <div onScroll={handleScroll}
                className="h-40 overflow-y-auto text-xs text-muted-foreground leading-relaxed font-mono bg-background rounded-lg p-3 border whitespace-pre-line">
                {CHARTER_TEXT}
              </div>
              {!charterScrolled && (
                <p className="text-xs text-muted-foreground mt-2 text-center">Faites défiler pour lire l'intégralité de la charte</p>
              )}
              <label className={`flex items-start gap-3 mt-3 cursor-pointer ${!charterScrolled ? "opacity-50 pointer-events-none" : ""}`}>
                <input type="checkbox" checked={charterAccepted} onChange={e => setCharterAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-primary rounded" />
                <span className="text-sm text-foreground font-medium">
                  J'ai lu et j'accepte la charte du donneur BloodLink
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
              disabled={registerMutation.isPending || !charterAccepted}>
              {registerMutation.isPending ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Inscription...</span>
              ) : (
                <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" />S'inscrire comme donneur</span>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
