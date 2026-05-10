import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Layout } from "@/components/Layout";
import { useListInvoices, usePayInvoice } from "@workspace/api-client-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Réglée",
  rejected: "Refusée",
};

export default function ClinicInvoices() {
  const { data, refetch } = useListInvoices({});
  const payMutation = usePayInvoice();
  const [payingInvoice, setPayingInvoice] = useState<any>(null);
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: "",
  });
  const [paymentState, setPaymentState] = useState<
    "idle" | "success" | "failed"
  >("idle");

  const invoices = data?.invoices || [];
  const pending = invoices.filter((i: any) => i.status === "pending");
  const totalPending = pending.reduce((s: number, i: any) => s + i.amount, 0);

  const handlePay = async () => {
    if (!payingInvoice) return;
    if (cardData.cardNumber.replace(/\s/g, "").length < 16) {
      toast.error("Numéro de carte invalide (16 chiffres requis).");
      return;
    }
    if (!cardData.expiryDate || !/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
      toast.error("Date d'expiration invalide (format MM/YY).");
      return;
    }
    if (cardData.cvv.length < 3) {
      toast.error("CVV invalide (3 chiffres requis).");
      return;
    }
    if (!cardData.cardHolder) {
      toast.error("Nom du titulaire requis.");
      return;
    }
    try {
      await payMutation.mutateAsync({
        id: payingInvoice.id,
        data: {
          cardNumber: cardData.cardNumber.replace(/\s/g, ""),
          expiryDate: cardData.expiryDate,
          cvv: cardData.cvv,
        },
      });
      setPaymentState("success");
      toast.success(
        "Paiement accepté. Votre demande est en cours de livraison.",
      );
      setTimeout(() => {
        setPayingInvoice(null);
        setPaymentState("idle");
        setCardData({
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          cardHolder: "",
        });
        refetch();
      }, 2500);
    } catch {
      setPaymentState("failed");
      toast.error(
        "Transaction refusée. Veuillez vérifier vos coordonnées bancaires ou utiliser un autre moyen de paiement.",
      );
    }
  };

  const formatCard = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Paiement des factures
          </h1>
          <p className="text-muted-foreground mt-1">
            {pending.length} facture(s) en attente — Total :{" "}
            <strong>{totalPending.toFixed(2)} TND</strong>
          </p>
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
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left pb-3 font-semibold text-muted-foreground">
                        N° Facture
                      </th>
                      <th className="text-left pb-3 font-semibold text-muted-foreground">
                        Payer Avant
                      </th>
                      <th className="text-left pb-3 font-semibold text-muted-foreground">
                        Montant
                      </th>
                      <th className="text-left pb-3 font-semibold text-muted-foreground">
                        Type
                      </th>
                      <th className="text-left pb-3 font-semibold text-muted-foreground">
                        Statut
                      </th>
                      <th className="text-left pb-3 font-semibold text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-muted/30">
                        <td className="py-3 font-mono text-xs font-semibold">
                          INV-{String(inv.id).padStart(5, "0")}
                        </td>
                        <td className="py-3 text-muted-foreground text-xs">
                          {inv.dueDate || "—"}
                        </td>
                        <td className="py-3 font-bold text-foreground">
                          {inv.amount.toFixed(2)} TND
                        </td>
                        <td className="py-3">
                          {inv.isEmergency ? (
                            <span className="flex items-center gap-1 text-xs text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded-full w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              Livraison d'urgence — Paiement différé
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-700"}`}
                          >
                            {STATUS_LABELS[inv.status] || inv.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {inv.status === "pending" && (
                            <Button
                              size="sm"
                              className="bg-primary text-white hover:bg-primary/90 gap-1"
                              onClick={() => {
                                setPayingInvoice(inv);
                                setPaymentState("idle");
                              }}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Payer
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
        <Dialog
          open={payingInvoice !== null}
          onOpenChange={() => {
            setPayingInvoice(null);
            setPaymentState("idle");
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Paiement sécurisé VISA
              </DialogTitle>
            </DialogHeader>
            <AnimatePresence mode="wait">
              {paymentState === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center"
                >
                  <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-3" />
                  <p className="font-bold text-green-800 text-lg">
                    Paiement accepté !
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Votre demande est en cours de livraison.
                  </p>
                </motion.div>
              ) : paymentState === "failed" ? (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center"
                >
                  <XCircle className="w-14 h-14 text-red-600 mx-auto mb-3" />
                  <p className="font-bold text-red-800 text-lg">
                    Transaction refusée
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Veuillez vérifier vos coordonnées bancaires ou utiliser un
                    autre moyen de paiement.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setPaymentState("idle")}
                  >
                    Réessayer
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 pt-2"
                >
                  {payingInvoice && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-foreground">
                        INV-{String(payingInvoice.id).padStart(5, "0")}
                      </p>
                      <p className="text-muted-foreground">
                        Montant :{" "}
                        <strong className="text-foreground">
                          {payingInvoice.amount?.toFixed(2)} TND
                        </strong>
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">
                      Nom du titulaire *
                    </Label>
                    <Input
                      value={cardData.cardHolder}
                      onChange={(e) =>
                        setCardData((d) => ({
                          ...d,
                          cardHolder: e.target.value,
                        }))
                      }
                      placeholder="Ahmed Ben Ali"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Numéro de carte *
                    </Label>
                    <Input
                      value={cardData.cardNumber}
                      onChange={(e) =>
                        setCardData((d) => ({
                          ...d,
                          cardNumber: formatCard(e.target.value),
                        }))
                      }
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="mt-1 font-mono tracking-widest"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Date d'expiration *
                      </Label>
                      <Input
                        value={cardData.expiryDate}
                        onChange={(e) =>
                          setCardData((d) => ({
                            ...d,
                            expiryDate: formatExpiry(e.target.value),
                          }))
                        }
                        placeholder="MM/YY"
                        maxLength={5}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">CVV *</Label>
                      <Input
                        value={cardData.cvv}
                        onChange={(e) =>
                          setCardData((d) => ({
                            ...d,
                            cvv: e.target.value.slice(0, 3),
                          }))
                        }
                        placeholder="000"
                        maxLength={3}
                        className="mt-1"
                        type="password"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <p className="text-xs text-green-800">
                      Paiement sécurisé — Chiffrement SSL 256-bit
                    </p>
                  </div>
                  <Button
                    className="w-full bg-primary text-white hover:bg-primary/90 font-semibold py-2.5"
                    onClick={handlePay}
                    disabled={payMutation.isPending}
                  >
                    {payMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Traitement...
                      </span>
                    ) : (
                      `Payer ${payingInvoice?.amount?.toFixed(2) || ""} TND`
                    )}
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
