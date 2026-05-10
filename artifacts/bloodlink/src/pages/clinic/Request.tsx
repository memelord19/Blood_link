import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplet,
  CheckCircle,
  AlertTriangle,
  Flame,
  Activity,
  Info,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [centers, setCenters] = useState<any[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);

  const createMutation = useCreateBloodRequest();
  const { token } = useAuth();
  // Fetch transfusion centers directly
  React.useEffect(() => {
    console.log("token value:", token);
    if (!token) {
      setLoadingCenters(false);
      return;
    }

    fetch("http://localhost:3000/api/centers", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setCenters(data.centers || []))
      .catch((err) => {
        console.error("Error fetching centers:", err);
        toast.error("Impossible de charger les centres.");
      })
      .finally(() => setLoadingCenters(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodType || !volume) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    if (!selectedCenter) {
      toast.error("Veuillez sélectionner un centre de transfusion.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        data: {
          bloodType,
          volume: parseFloat(volume),
          urgency,
          centerId: selectedCenter.id,
        } as any,
      });
      setSubmitted(true);
      toast.success("Demande enregistrée avec succès.");
    } catch {
      toast.error("Erreur lors de l'envoi de la demande.");
    }
  };

  const reset = () => {
    setBloodType("");
    setVolume("");
    setUrgency("normal");
    setSelectedCenter(null);
    setSubmitted(false);
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
                Demande enregistrée !
              </h2>
              <p className="text-green-700 mb-6">
                Votre demande a été transmise à{" "}
                <strong>{selectedCenter?.nom}</strong>.
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
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Center selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Centre de transfusion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingCenters ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="h-16 bg-muted animate-pulse rounded-xl"
                          />
                        ))}
                      </div>
                    ) : centers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun centre disponible.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {centers.map((center: any) => (
                          <button
                            key={center.id}
                            type="button"
                            onClick={() => setSelectedCenter(center)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                              selectedCenter?.id === center.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <p className="font-semibold text-sm text-foreground">
                              {center.nom}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {center.adresse} — {center.region}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Blood type */}
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

                {/* Volume */}
                <Card>
                  <CardContent className="p-5">
                    <Label className="text-sm font-medium">
                      Volume requis (mL) *
                    </Label>
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

                {/* Urgency */}
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

                {/* Summary */}
                {bloodType && volume && selectedCenter && (
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                    <BloodTypeBadge bloodType={bloodType} />
                    <div>
                      <p className="font-semibold text-foreground">
                        {volume} mL de sang {bloodType} → {selectedCenter.nom}
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
                  disabled={
                    createMutation.isPending ||
                    !bloodType ||
                    !volume ||
                    !selectedCenter
                  }
                >
                  {createMutation.isPending
                    ? "Envoi en cours..."
                    : "Envoyer la demande"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
