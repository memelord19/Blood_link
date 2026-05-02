import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, CheckSquare, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useScanBloodBag, useReceiveBloodBag } from "@workspace/api-client-react";
import { toast } from "sonner";

export default function CenterReception() {
  const [barcode, setBarcode] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [checks, setChecks] = useState({ temperatureOk: false, integrityOk: false });
  const [rejectionReason, setRejectionReason] = useState("");
  const [result, setResult] = useState<null | "accepted" | "rejected">(null);

  const { data: bag, isLoading: scanning, isError } = useScanBloodBag(scanCode, { query: { enabled: !!scanCode } });
  const receiveMutation = useReceiveBloodBag();

  const handleScan = () => { if (barcode.trim()) setScanCode(barcode.trim()); };

  const handleAction = async (accept: boolean) => {
    if (!bag) return;
    try {
      await receiveMutation.mutateAsync({ id: (bag as any).id, data: { temperatureOk: checks.temperatureOk, integrityOk: checks.integrityOk, accepted: accept, rejectionReason } });
      setResult(accept ? "accepted" : "rejected");
      toast.success(accept ? "Poche acceptée et intégrée au stock." : "Poche rejetée et enregistrée.");
    } catch { toast.error("Erreur lors de l'opération."); }
  };

  const reset = () => { setBarcode(""); setScanCode(""); setChecks({ temperatureOk: false, integrityOk: false }); setRejectionReason(""); setResult(null); };
  const bagData = bag as any;
  const allChecked = checks.temperatureOk && checks.integrityOk;
  const expiresStr = bagData?.expirationDate ? new Date(bagData.expirationDate).toLocaleDateString("fr-TN") : "";
  const isExpired = bagData?.expirationDate && new Date(bagData.expirationDate) < new Date();

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Réception des poches</h1>
          <p className="text-muted-foreground mt-1">Inspection et validation des poches de sang reçues</p>
        </div>

        {/* Scan */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Scan className="w-5 h-5 text-primary" />Scanner la poche</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Code-barres de la poche..." className="font-mono"
                onKeyDown={e => e.key === "Enter" && handleScan()} />
              <Button onClick={handleScan} className="bg-primary text-white hover:bg-primary/90" disabled={scanning || !barcode}>Scan</Button>
            </div>
            {scanning && <div className="mt-4 h-16 bg-muted animate-pulse rounded-xl" />}
            {isError && <p className="text-destructive text-sm mt-3">Code-barres non trouvé dans le système.</p>}
          </CardContent>
        </Card>

        {/* Bag info + checklist */}
        <AnimatePresence>
          {bagData && !result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Bag info */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <BloodTypeBadge type={bagData.bloodType} size="lg" />
                    <div>
                      <p className="font-bold text-foreground text-lg">{bagData.bloodType}</p>
                      <p className="text-sm text-muted-foreground font-mono">{bagData.barcode}</p>
                      <p className="text-sm text-muted-foreground">Collecté : {bagData.collectionDate} · Expire : <span className={isExpired ? "text-red-600 font-bold" : ""}>{expiresStr}</span></p>
                      <p className="text-sm text-muted-foreground">Centre émetteur : {bagData.centerName}</p>
                    </div>
                  </div>
                  {isExpired && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <p className="text-sm text-red-800 font-semibold">Cette poche est expirée ! Rejet obligatoire.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><CheckSquare className="w-5 h-5 text-primary" />Checklist d'inspection</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: "temperatureOk", label: "Chaîne du froid respectée (2-6°C)" },
                    { key: "integrityOk", label: "Intégrité de la poche vérifiée (pas de fuite, étanchéité OK)" },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer border border-border hover:border-primary/40 transition-colors">
                      <input type="checkbox" checked={checks[item.key as keyof typeof checks]}
                        onChange={e => setChecks(c => ({ ...c, [item.key]: e.target.checked }))}
                        className="w-4 h-4 accent-primary" disabled={isExpired} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>

              {/* Rejection reason */}
              {!allChecked && (
                <Card>
                  <CardContent className="p-5">
                    <Label className="text-sm font-medium">Motif de rejet (requis si refus)</Label>
                    <Textarea value={rejectionReason} onChange={(e: any) => setRejectionReason(e.target.value)} placeholder="Décrivez le motif de rejet..." rows={3} className="mt-1.5" />
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2" disabled={!allChecked || isExpired || receiveMutation.isPending} onClick={() => handleAction(true)}>
                  <CheckCircle className="w-4 h-4" />Accepter la poche
                </Button>
                <Button className="flex-1 border-red-300 text-red-700 hover:bg-red-50 gap-2" variant="outline" disabled={receiveMutation.isPending} onClick={() => handleAction(false)}>
                  <XCircle className="w-4 h-4" />Rejeter
                </Button>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl p-10 text-center border-2 ${result === "accepted" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              {result === "accepted" ? <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" /> : <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />}
              <h2 className={`text-2xl font-bold mb-2 ${result === "accepted" ? "text-green-800" : "text-red-800"}`}>
                Poche {result === "accepted" ? "acceptée" : "rejetée"}
              </h2>
              <Button className="mt-4 bg-primary text-white hover:bg-primary/90" onClick={reset}>Poche suivante</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
