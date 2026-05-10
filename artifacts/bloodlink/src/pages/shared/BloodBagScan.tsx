import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Droplet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

type ScanResult = {
  success: boolean;
  bloodBag?: any;
  error?: string;
};

export default function BloodBagScan() {
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const handleScan = async () => {
    if (!barcode.trim()) {
      toast.error("Veuillez saisir ou scanner un code-barres.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://localhost:3000/api/blood-bags/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ barcode: barcode.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, bloodBag: data.bloodBag });
        toast.success("Poche de sang trouvée et mise à jour.");
      } else {
        setResult({
          success: false,
          error: data.error,
          bloodBag: data.bloodBag,
        });
        toast.error(data.error);
      }
    } catch (err) {
      setResult({ success: false, error: "Erreur de connexion au serveur." });
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBarcode("");
    setResult(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleScan();
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Scanner une poche de sang
          </h1>
          <p className="text-muted-foreground mt-1">
            Scannez ou saisissez le code-barres pour identifier et mettre à jour
            la poche
          </p>
        </div>

        {/* Input card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />
              Code-barres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Scanner ou saisir le code-barres
              </Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  ref={inputRef}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ex: BB-2025-00123"
                  autoFocus
                  className="font-mono"
                />
                <Button
                  onClick={handleScan}
                  disabled={loading || !barcode.trim()}
                  className="bg-primary hover:bg-primary/90 text-white shrink-0"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Appuyez sur Entrée ou cliquez sur le bouton pour rechercher
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={barcode + result.success}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {result.success && result.bloodBag ? (
                <Card className="border-2 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      Poche identifiée et mise à jour
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                      <BloodTypeBadge bloodType={result.bloodBag.bloodType} />
                      <div>
                        <p className="font-bold text-foreground">
                          {result.bloodBag.bloodType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Groupe sanguin
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Code-barres
                        </p>
                        <p className="font-mono font-medium">
                          {result.bloodBag.barcode}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Statut
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {result.bloodBag.status}
                        </span>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Date de prélèvement
                        </p>
                        <p className="font-medium">
                          {new Date(
                            result.bloodBag.collectionDate,
                          ).toLocaleDateString("fr-TN")}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Date d'expiration
                        </p>
                        <p className="font-medium">
                          {new Date(
                            result.bloodBag.expirationDate,
                          ).toLocaleDateString("fr-TN")}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Centre
                        </p>
                        <p className="font-medium">
                          {result.bloodBag.centerName || "—"}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Donneur ID
                        </p>
                        <p className="font-medium">
                          #{result.bloodBag.donorId || "—"}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="w-full"
                    >
                      Scanner une autre poche
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-red-200">
                  <CardContent className="p-6 text-center">
                    {result.error?.includes("périmée") ? (
                      <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                    ) : (
                      <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    )}
                    <p className="font-semibold text-foreground mb-1">
                      {result.error?.includes("périmée")
                        ? "Poche périmée"
                        : result.error?.includes("rejetée")
                          ? "Poche rejetée"
                          : result.error?.includes("transfusée")
                            ? "Déjà transfusée"
                            : "Poche introuvable"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {result.error}
                    </p>

                    {/* Show blood bag info even on error if returned */}
                    {result.bloodBag && (
                      <div className="flex items-center justify-center gap-3 p-3 bg-muted/30 rounded-lg mb-4">
                        <BloodTypeBadge bloodType={result.bloodBag.bloodType} />
                        <div className="text-left">
                          <p className="text-sm font-medium">
                            {result.bloodBag.barcode}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Statut : {result.bloodBag.status}
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="w-full"
                    >
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
