import React, { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Plus, CheckCircle, Flame, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useAuth } from "@/lib/auth-context";
import { useListAlerts, useCreateAlert, useUpdateAlert } from "@workspace/api-client-react";
import { toast } from "sonner";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const TUNISIAN_REGIONS = ["Tunis", "Ariana", "Ben Arous", "Sfax", "Sousse", "Nabeul", "Bizerte", "Monastir", "Gabès", "Médenine", "Kairouan", "Gafsa"];
const URGENCY_ICONS: Record<string, React.ElementType> = { normal: Activity, urgent: AlertTriangle, critical: Flame };
const URGENCY_COLORS: Record<string, string> = { normal: "bg-blue-100 text-blue-800", urgent: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800" };

export default function CenterAlerts() {
  const { user } = useAuth();
  const isBloodBank = user?.role === "blood_bank";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bloodType: "", region: "", urgency: "normal", message: "" });

  const { data, refetch } = useListAlerts({});
  const createMutation = useCreateAlert();
  const updateMutation = useUpdateAlert();

  const alerts = data?.alerts || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bloodType || !form.region || !form.message) { toast.error("Remplissez tous les champs."); return; }
    try {
      await createMutation.mutateAsync({ data: form as any });
      toast.success("Alerte créée et envoyée aux centres !");
      setShowForm(false);
      setForm({ bloodType: "", region: "", urgency: "normal", message: "" });
      refetch();
    } catch { toast.error("Erreur lors de la création."); }
  };

  const handleResolve = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: "resolved" } });
      toast.success("Alerte résolue.");
      refetch();
    } catch { toast.error("Erreur."); }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alertes de pénurie</h1>
            <p className="text-muted-foreground mt-1">{isBloodBank ? "Créez et gérez les alertes de pénurie" : "Alertes reçues des banques de sang"}</p>
          </div>
          {isBloodBank && (
            <Button className="bg-primary text-white hover:bg-primary/90 gap-2" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4" />Nouvelle alerte
            </Button>
          )}
        </div>

        {/* Create form (blood bank only) */}
        {isBloodBank && showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Créer une alerte de pénurie</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Groupe sanguin *</Label>
                      <Select onValueChange={v => setForm(f => ({ ...f, bloodType: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Groupe" /></SelectTrigger>
                        <SelectContent>{BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Région *</Label>
                      <Select onValueChange={v => setForm(f => ({ ...f, region: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Région" /></SelectTrigger>
                        <SelectContent>{TUNISIAN_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Urgence *</Label>
                      <Select defaultValue="normal" onValueChange={v => setForm(f => ({ ...f, urgency: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normale</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                          <SelectItem value="critical">Critique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Message *</Label>
                    <Textarea value={form.message} onChange={(e: any) => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Décrivez la situation de pénurie..." rows={3} className="mt-1" />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="bg-primary text-white hover:bg-primary/90" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Envoi..." : "Diffuser l'alerte"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Alerts list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              {isBloodBank ? `Alertes émises (${alerts.length})` : `Alertes reçues (${alerts.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucune alerte active</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert: any) => {
                  const UrgencyIcon = URGENCY_ICONS[alert.urgency] || Activity;
                  return (
                    <div key={alert.id} className={`p-4 rounded-xl border ${alert.urgency === "critical" ? "border-red-200 bg-red-50/30" : alert.urgency === "urgent" ? "border-orange-200 bg-orange-50/30" : "border-border bg-muted/20"}`}>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-4">
                          <BloodTypeBadge type={alert.bloodType} />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground">{alert.centerName}</p>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${URGENCY_COLORS[alert.urgency]}`}>
                                <UrgencyIcon className="w-3 h-3" />{alert.urgency}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${alert.status === "active" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                                {alert.status === "active" ? "Active" : "Résolue"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Région: {alert.region} · {new Date(alert.createdAt).toLocaleDateString("fr-TN")}</p>
                          </div>
                        </div>
                        {isBloodBank && alert.status === "active" && (
                          <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 gap-1" onClick={() => handleResolve(alert.id)}>
                            <CheckCircle className="w-3.5 h-3.5" />Résoudre
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
