import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useGetDonorByCin, useListDonors, useRegisterDonor } from "@workspace/api-client-react";
import { toast } from "sonner";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const TUNISIAN_REGIONS = ["Tunis", "Ariana", "Ben Arous", "Sfax", "Sousse", "Nabeul", "Bizerte", "Monastir", "Gabès", "Médenine", "Kasserine", "Kairouan", "Gafsa"];

const STATUS_ICONS: Record<string, React.ElementType> = {
  eligible: CheckCircle, temporarily_excluded: Clock, permanently_ineligible: XCircle
};
const STATUS_COLORS: Record<string, string> = {
  eligible: "text-green-600 bg-green-50", temporarily_excluded: "text-orange-600 bg-orange-50", permanently_ineligible: "text-red-600 bg-red-50"
};
const STATUS_LABELS: Record<string, string> = {
  eligible: "Éligible", temporarily_excluded: "Temp. exclu", permanently_ineligible: "Inapte définitivement"
};

export default function CenterDonors() {
  const [searchCin, setSearchCin] = useState("");
  const [queryCin, setQueryCin] = useState("");
  const [showRegForm, setShowRegForm] = useState(false);
  const [filterBt, setFilterBt] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [regForm, setRegForm] = useState({ firstName: "", lastName: "", cin: "", dateOfBirth: "", gender: "", weight: "", phone: "", email: "", region: "", bloodType: "" });
  
  const { data: foundDonor, isLoading: searching, isError } = useGetDonorByCin(queryCin, { query: { enabled: !!queryCin } });
  const { data: listData } = useListDonors({ bloodType: filterBt !== "all" ? filterBt : undefined, region: filterRegion !== "all" ? filterRegion : undefined });
  const registerMutation = useRegisterDonor();

  const handleSearch = () => { if (searchCin.trim()) setQueryCin(searchCin.trim()); };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerMutation.mutateAsync({ data: { ...regForm, weight: parseFloat(regForm.weight) as any } });
      toast.success("Donneur inscrit avec succès !");
      setShowRegForm(false);
      setRegForm({ firstName: "", lastName: "", cin: "", dateOfBirth: "", gender: "", weight: "", phone: "", email: "", region: "", bloodType: "" });
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'inscription.");
    }
  };

  const donors = listData?.donors || [];

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Donneurs</h1>
            <p className="text-muted-foreground mt-1">Recherche, inscription et gestion des donneurs</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white gap-2" onClick={() => setShowRegForm(!showRegForm)}>
            <UserPlus className="w-4 h-4" />Inscrire un donneur
          </Button>
        </div>

        {/* CIN Search */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Search className="w-5 h-5 text-primary" />Recherche par CIN</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={searchCin} onChange={e => setSearchCin(e.target.value)} placeholder="Entrez le numéro CIN (8 chiffres)" maxLength={8}
                onKeyDown={e => e.key === "Enter" && handleSearch()} className="font-mono" />
              <Button onClick={handleSearch} className="bg-primary text-white hover:bg-primary/90 shrink-0" disabled={searching}>
                {searching ? "Recherche..." : "Rechercher"}
              </Button>
            </div>
            {queryCin && (
              <AnimatePresence>
                {searching ? (
                  <div className="mt-4 h-20 bg-muted animate-pulse rounded-xl" />
                ) : foundDonor ? (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-muted/30 rounded-xl p-4 border border-border flex items-center gap-4">
                    <BloodTypeBadge type={(foundDonor as any).bloodType} />
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{(foundDonor as any).firstName} {(foundDonor as any).lastName}</p>
                      <p className="text-sm text-muted-foreground">CIN: {(foundDonor as any).cin} · {(foundDonor as any).region}</p>
                      <p className="text-xs text-muted-foreground">{(foundDonor as any).totalDonations} dons au total</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${STATUS_COLORS[(foundDonor as any).eligibilityStatus] || ""}`}>
                      {React.createElement(STATUS_ICONS[(foundDonor as any).eligibilityStatus] || CheckCircle, { className: "w-4 h-4" })}
                      {STATUS_LABELS[(foundDonor as any).eligibilityStatus]}
                    </div>
                  </motion.div>
                ) : isError ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-orange-800 font-medium text-sm">Aucun donneur trouvé avec ce CIN.</p>
                    <Button size="sm" className="mt-2 bg-primary text-white hover:bg-primary/90" onClick={() => { setShowRegForm(true); setRegForm(f => ({ ...f, cin: queryCin })); }}>
                      <UserPlus className="w-4 h-4 mr-1" />Inscrire ce donneur
                    </Button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

        {/* Register form */}
        <AnimatePresence>
          {showRegForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Inscription d'un nouveau donneur</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label className="text-sm">Prénom *</Label><Input value={regForm.firstName} onChange={e => setRegForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Prénom" className="mt-1" required /></div>
                      <div><Label className="text-sm">Nom *</Label><Input value={regForm.lastName} onChange={e => setRegForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Nom" className="mt-1" required /></div>
                      <div><Label className="text-sm">CIN *</Label><Input value={regForm.cin} onChange={e => setRegForm(f => ({ ...f, cin: e.target.value }))} placeholder="12345678" maxLength={8} className="mt-1 font-mono" required /></div>
                      <div><Label className="text-sm">Date de naissance *</Label><Input type="date" value={regForm.dateOfBirth} onChange={e => setRegForm(f => ({ ...f, dateOfBirth: e.target.value }))} className="mt-1" required /></div>
                      <div><Label className="text-sm">Genre *</Label>
                        <Select onValueChange={v => setRegForm(f => ({ ...f, gender: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Genre" /></SelectTrigger><SelectContent><SelectItem value="male">Homme</SelectItem><SelectItem value="female">Femme</SelectItem></SelectContent></Select>
                      </div>
                      <div><Label className="text-sm">Poids (kg) *</Label><Input type="number" value={regForm.weight} onChange={e => setRegForm(f => ({ ...f, weight: e.target.value }))} placeholder="70" min="50" className="mt-1" required /></div>
                      <div><Label className="text-sm">Groupe sanguin *</Label>
                        <Select onValueChange={v => setRegForm(f => ({ ...f, bloodType: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Groupe" /></SelectTrigger><SelectContent>{BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <div><Label className="text-sm">Région *</Label>
                        <Select onValueChange={v => setRegForm(f => ({ ...f, region: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Région" /></SelectTrigger><SelectContent>{TUNISIAN_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <div><Label className="text-sm">Téléphone</Label><Input value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} placeholder="20xxxxxx" className="mt-1" /></div>
                      <div><Label className="text-sm">Email</Label><Input type="email" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemple.com" className="mt-1" /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="submit" className="bg-primary text-white hover:bg-primary/90" disabled={registerMutation.isPending}>{registerMutation.isPending ? "Inscription..." : "Inscrire le donneur"}</Button>
                      <Button type="button" variant="outline" onClick={() => setShowRegForm(false)}>Annuler</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Donors list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">Liste des donneurs ({donors.length})</CardTitle>
              <div className="flex gap-2">
                <Select onValueChange={setFilterBt}>
                  <SelectTrigger className="w-28"><SelectValue placeholder="Groupe" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Tous</SelectItem>{BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent>
                </Select>
                <Select onValueChange={setFilterRegion}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Région" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Toutes</SelectItem>{TUNISIAN_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left pb-3 font-semibold text-muted-foreground">Donneur</th>
                  <th className="text-left pb-3 font-semibold text-muted-foreground">CIN</th>
                  <th className="text-left pb-3 font-semibold text-muted-foreground">Groupe</th>
                  <th className="text-left pb-3 font-semibold text-muted-foreground">Région</th>
                  <th className="text-left pb-3 font-semibold text-muted-foreground">Statut</th>
                  <th className="text-left pb-3 font-semibold text-muted-foreground">Dons</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {donors.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Aucun donneur trouvé</td></tr>
                  ) : donors.map((d: any) => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium">{d.firstName} {d.lastName}</td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">{d.cin}</td>
                      <td className="py-3"><BloodTypeBadge type={d.bloodType} size="sm" /></td>
                      <td className="py-3 text-muted-foreground">{d.region}</td>
                      <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[d.eligibilityStatus]}`}>{STATUS_LABELS[d.eligibilityStatus]}</span></td>
                      <td className="py-3 font-semibold text-foreground">{d.totalDonations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
