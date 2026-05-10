import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplet,
  CheckCircle,
  AlertTriangle,
  Flame,
  Activity,
  Building2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useCreateBloodRequest } from "@workspace/api-client-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY_OPTIONS = [
  {
    value: "normal",
    label: "Normale",
    desc: "Délai de livraison standard (24-48h)",
    icon: Activity,
    color: "text-gray-600",
  },
  {
    value: "urgent",
    label: "Urgente",
    desc: "Délai réduit (4-8h)",
    icon: AlertTriangle,
    color: "text-orange-600",
  },
  {
    value: "critical",
    label: "Critique",
    desc: "Livraison immédiate requise",
    icon: Flame,
    color: "text-red-600",
  },
];

export default function ClinicRequest() {
  const [bloodType, setBloodType] = useState("");
  const [volume, setVolume] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<"form" | "select-centers">("form");
  const [externalCenters, setExternalCenters] = useState<any[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<any[]>([]);

  const createMutation = useCreateBloodRequest();
  const { token } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodType || !volume) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    try {
      const result = (await createMutation.mutateAsync({
        data: { bloodType, volume: parseFloat(volume), urgency } as any,
      })) as any;

      if (result.needsExternalSelection) {
        setExternalCenters(result.externalCenters);
        setStep("select-centers");
        toast.info("Sélectionnez jusqu'à 3 centres pour votre demande.");
      } else {
        setSubmitted(true);
        toast.success("Demande enregistrée avec succès.");
      }
    } catch {
      toast.error("Erreur lors de l'envoi de la demande.");
    }
  };

  const toggleCenter = (center: any) => {
    setSelectedCenters((prev) => {
      const already = prev.find((c) => c.prefixedId === center.prefixedId);
      if (already)
        return prev.filter((c) => c.prefixedId !== center.prefixedId);
      if (prev.length >= 3) {
        toast.error("Vous ne pouvez sélectionner que 3 centres maximum.");
        return prev;
      }
      return [...prev, center];
    });
  };

  const handleExternalSubmit = async () => {
    if (selectedCenters.length === 0) {
      toast.error("Veuillez sélectionner au moins un centre.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        data: {
          bloodType,
          volume: parseFloat(volume),
          urgency,
          centerIds: selectedCenters.map((c) => c.prefixedId),
        } as any,
      });
      setSubmitted(true);
      toast.success("Demande(s) enregistrée(s) avec succès.");
    } catch {
      toast.error("Erreur lors de l'envoi.");
    }
  };

  const reset = () => {
    setBloodType("");
    setVolume("");
    setUrgency("normal");
    setSubmitted(false);
    setStep("form");
    setExternalCenters([]);
    setSelectedCenters([]);
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Nouvelle demande de sang
          </h1>
          <p className="text-muted-foreground mt-1">
            Soumettez une demande au centre de transfusion
          </p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border-2 border-green-200 rounded-2xl p-12 text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Demande(s) enregistrée(s) !
              </h2>
              <p className="text-green-700 mb-6">
                Vous recevrez une notification dès qu'une demande sera traitée.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => (window.location.href = "/clinic/tracking")}
                >
                  Suivre la demande
                </Button>
                <Button variant="outline" onClick={reset}>
                  Nouvelle demande
                </Button>
              </div>
            </motion.div>
          ) : step === "select-centers" ? (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Sélectionnez jusqu'à 3 centres ({selectedCenters.length}/3)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {externalCenters.map((center: any) => {
                    const isSelected = selectedCenters.find(
                      (c) => c.prefixedId === center.prefixedId,
                    );
                    return (
                      <button
                        key={center.prefixedId}
                        type="button"
                        onClick={() => toggleCenter(center)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {center.nom}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {center.adresse} — {center.region}
                            <span
                              className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                                center.type === "blood_bank"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {center.type === "blood_bank"
                                ? "Banque de sang"
                                : "Centre de transfusion"}
                            </span>
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {selectedCenters.length > 0 && (
                <div className="bg-muted/30 border border-border rounded-xl p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Centres sélectionnés :
                  </p>
                  <div className="space-y-1">
                    {selectedCenters.map((c) => (
                      <div
                        key={c.prefixedId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{c.nom}</span>
                        <button
                          onClick={() => toggleCenter(c)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("form")}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  onClick={handleExternalSubmit}
                  disabled={
                    selectedCenters.length === 0 || createMutation.isPending
                  }
                >
                  {createMutation.isPending
                    ? "Envoi..."
                    : `Envoyer à ${selectedCenters.length} centre(s)`}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-primary" />
                      Groupe sanguin requis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_TYPES.map((bt) => (
                        <button
                          key={bt}
                          type="button"
                          onClick={() => setBloodType(bt)}
                          className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all font-bold text-sm ${bloodType === bt ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white mb-1 ${bloodType === bt ? "bg-primary" : "bg-muted-foreground/30"}`}
                          >
                            {bt}
                          </div>
                          {bt}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <label className="text-sm font-medium">
                      Volume requis (mL) *
                    </label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[250, 450, 500, 900].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVolume(String(v))}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${volume === String(v) ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                        >
                          {v} mL
                        </button>
                      ))}
                      <Input
                        type="number"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        placeholder="Autre..."
                        min="100"
                        step="50"
                        className="w-32"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Niveau d'urgence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {URGENCY_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${urgency === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                      >
                        <input
                          type="radio"
                          name="urgency"
                          value={opt.value}
                          checked={urgency === opt.value}
                          onChange={() => setUrgency(opt.value)}
                          className="accent-primary"
                        />
                        <opt.icon className={`w-5 h-5 shrink-0 ${opt.color}`} />
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {opt.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {opt.desc}
                          </p>
                        </div>
                      </label>
                    ))}
                  </CardContent>
                </Card>

                {bloodType && volume && (
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                    <BloodTypeBadge bloodType={bloodType} />
                    <div>
                      <p className="font-semibold text-foreground">
                        Récapitulatif : {volume} mL de sang {bloodType}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Urgence :{" "}
                        {
                          URGENCY_OPTIONS.find((o) => o.value === urgency)
                            ?.label
                        }
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
                  disabled={createMutation.isPending || !bloodType || !volume}
                >
                  {createMutation.isPending ? "Vérification..." : "Continuer"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
