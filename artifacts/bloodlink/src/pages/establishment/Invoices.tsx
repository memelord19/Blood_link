import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, CreditCard, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Layout } from "@/components/Layout";
import { useListInvoices, usePayInvoice } from "@workspace/api-client-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800", paid: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800"
};
const STATUS_LABELS: Record<string, string> = { pending: "En attente", paid: "Payée", rejected: "Rejetée" };

export default function EstablishmentInvoices() {
  const { data, refetch } = useListInvoices({});
  const payMutation = usePayInvoice();
  const [payingId, setPayingId] = useState<number | null>(null);
  const [cardData, setCardData] = useState({ cardNumber: "", expiryDate: "", cvv: "" });
  const [success, setSuccess] = useState(false);

  const invoices = data?.invoices || [];
  const pending = invoices.filter((i: any) => i.status === "pending");
  const totalPending = pending.reduce((s: number, i: any) => s + i.amount, 0);

  const handlePay = async () => {
    if (!payingId) return;
    if (cardData.cardNumber.replace(/\s/g, "").length < 16) { toast.error("Numéro de carte invalide."); return; }
    if (!cardData.expiryDate || !cardData.cvv) { toast.error("Remplissez tous les champs."); return; }
    try {
      await payMutation.mutateAsync({ id: payingId, data: { cardNumber: cardData.cardNumber.replace(/\s/g, ""), expiryDate: cardData.expiryDate, cvv: cardData.cvv } });
      setSuccess(true);
      setTimeout(() => { setPayingId(null); setSuccess(false); setCardData({ cardNumber: "", expiryDate: "", cvv: "" }); refetch(); }, 2000);
    } catch { toast.error("Erreur lors du paiement."); }
  };

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Factures</h1>
          <p className="text-muted-foreground mt-1">{pending.length} facture(s) en attente — Total : <strong>{totalPending.toFixed(2)} TND</strong></p>
        </div>

        {/* Invoices table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Toutes les factures ({invoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucune facture disponible</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="text-left pb-3 font-semibold text-muted-foreground">N° Facture</th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">Montant</th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">Échéance</th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">Type</th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">Statut</th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">Action</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-muted/30">
                        <td className="py-3 font-mono text-xs font-semibold">INV-{String(inv.id).padStart(5, "0")}</td>
                        <td className="py-3 font-bold text-foreground">{inv.amount.toFixed(2)} TND</td>
                        <td className="py-3 text-muted-foreground">{inv.dueDate || "—"}</td>
                        <td className="py-3">
                          {inv.isEmergency && (
                            <span className="flex items-center gap-1 text-xs text-red-700 font-semibold">
                              <AlertTriangle className="w-3 h-3" />Urgence
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-700"}`}>
                            {STATUS_LABELS[inv.status] || inv.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {inv.status === "pending" && (
                            <Button size="sm" className="bg-primary text-white hover:bg-primary/90 gap-1" onClick={() => setPayingId(inv.id)}>
                              <CreditCard className="w-3.5 h-3.5" />Payer
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment modal */}
        <Dialog open={payingId !== null} onOpenChange={() => setPayingId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />Paiement sécurisé
              </DialogTitle>
            </DialogHeader>
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
                  <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-3" />
                  <p className="font-bold text-green-800 text-lg">Paiement effectué !</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-2">
                  <div>
                    <Label className="text-sm font-medium">Numéro de carte *</Label>
                    <Input value={cardData.cardNumber} onChange={e => setCardData(d => ({ ...d, cardNumber: formatCard(e.target.value) }))}
                      placeholder="0000 0000 0000 0000" maxLength={19} className="mt-1 font-mono tracking-widest" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Date d'expiration *</Label>
                      <Input value={cardData.expiryDate} onChange={e => setCardData(d => ({ ...d, expiryDate: e.target.value }))} placeholder="MM/YY" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">CVV *</Label>
                      <Input value={cardData.cvv} onChange={e => setCardData(d => ({ ...d, cvv: e.target.value.slice(0, 3) }))} placeholder="000" maxLength={3} className="mt-1" type="password" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <p className="text-xs text-green-800">Paiement sécurisé — Chiffrement SSL 256-bit</p>
                  </div>
                  <Button className="w-full bg-primary text-white hover:bg-primary/90 font-semibold py-2.5" onClick={handlePay} disabled={payMutation.isPending}>
                    {payMutation.isPending ? "Traitement..." : `Payer ${invoices.find((i: any) => i.id === payingId)?.amount?.toFixed(2) || ""} TND`}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
