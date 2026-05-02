import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { useSubmitMedicalForm, useListDonors } from "@workspace/api-client-react";
import { toast } from "sonner";

type EligibilityResult = { eligible: boolean; status: string; reason?: string | null; nextEligibleDate?: string | null };

function RadioGroup({ label, name, value, onChange }: { label: string; name: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-foreground font-medium pr-4">{label}</span>
      <div className="flex gap-3 shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" name={name} checked={value === true} onChange={() => onChange(true)} className="accent-primary" />
          <span className="text-sm text-foreground">Oui</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" name={name} checked={value === false} onChange={() => onChange(false)} className="accent-primary" />
          <span className="text-sm text-foreground">Non</span>
        </label>
      </div>
    </div>
  );
}

export default function MedicalForm() {
  const { user } = useAuth();
  const { data: donorsData } = useListDonors({ limit: 1 });
  const donor = donorsData?.donors?.[0];
  const submitMutation = useSubmitMedicalForm();
  const [result, setResult] = useState<EligibilityResult | null>(null);

  const [form, setForm] = useState({
    currentMedications: "",
    recentSurgeries: null as boolean | null,
    recentTravelEndemicZones: null as boolean | null,
    recentDentalCare: null as boolean | null,
    lastDonationDate: "",
    otherNotes: "",
  });

  const isComplete = form.recentSurgeries !== null && form.recentTravelEndemicZones !== null && form.recentDentalCare !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) { toast.error("Veuillez répondre à toutes les questions."); return; }
    try {
      const donorId = donor?.id || 1;
      const res = await submitMutation.mutateAsync({ id: donorId, data: form as any });
      setResult(res as any);
    } catch {
      toast.error("Erreur lors de la soumission.");
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formulaire médical pré-don</h1>
          <p className="text-muted-foreground mt-1">Répondez honnêtement pour évaluer votre éligibilité au don.</p>
        </div>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl p-8 text-center border-2 ${result.eligible ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
              {result.eligible ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-800 mb-2">Vous êtes éligible !</h2>
                  <p className="text-green-700 mb-6">Votre profil de santé vous permet de donner votre sang aujourd'hui.</p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => window.location.href = "/donor/appointments"}>
                    Prendre rendez-vous
                  </Button>
                </>
              ) : (
                <>
                  <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-orange-800 mb-2">Temporairement exclu</h2>
                  <p className="text-orange-700 mb-2">Raison : <strong>{result.reason || "Critère médical non satisfait"}</strong></p>
                  {result.nextEligibleDate && (
                    <p className="text-orange-700">Prochaine date éligible : <strong>{new Date(result.nextEligibleDate).toLocaleDateString("fr-TN")}</strong></p>
                  )}
                  <Button variant="outline" className="mt-6" onClick={() => setResult(null)}>Refaire le formulaire</Button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Questions de santé</CardTitle></CardHeader>
                  <CardContent className="space-y-0">
                    <RadioGroup label="Avez-vous subi une chirurgie au cours des 6 derniers mois ?" name="surgery" value={form.recentSurgeries} onChange={v => setForm(f => ({ ...f, recentSurgeries: v }))} />
                    <RadioGroup label="Avez-vous voyagé dans une zone endémique récemment ?" name="travel" value={form.recentTravelEndemicZones} onChange={v => setForm(f => ({ ...f, recentTravelEndemicZones: v }))} />
                    <RadioGroup label="Avez-vous eu des soins dentaires dans les 7 derniers jours ?" name="dental" value={form.recentDentalCare} onChange={v => setForm(f => ({ ...f, recentDentalCare: v }))} />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Médicaments actuels (listez ou écrivez "Aucun")</Label>
                      <Textarea {...{ value: form.currentMedications, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, currentMedications: e.target.value })) }} placeholder="Ex: Aspirine, Paracétamol, Aucun..." rows={3} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date du dernier don (si applicable)</Label>
                      <Input type="date" value={form.lastDonationDate} onChange={e => setForm(f => ({ ...f, lastDonationDate: e.target.value }))} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Notes supplémentaires</Label>
                      <Textarea value={form.otherNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, otherNotes: e.target.value }))} placeholder="Toute information médicale pertinente..." rows={2} className="mt-1.5" />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">Toutes vos réponses sont confidentielles et utilisées uniquement pour évaluer votre éligibilité médicale au don de sang.</p>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
                  disabled={submitMutation.isPending || !isComplete}>
                  {submitMutation.isPending ? "Évaluation en cours..." : "Soumettre et évaluer mon éligibilité"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
