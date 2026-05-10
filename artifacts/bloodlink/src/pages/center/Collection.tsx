import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, CheckCircle, AlertTriangle, Droplet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import {
  useScanBloodBag,
  useRecordDonation,
  useListDonors,
} from "@workspace/api-client-react";
import { toast } from "sonner";

export default function CenterCollection() {
  const [barcode, setBarcode] = useState("");
  const [scanBarcode, setScanBarcode] = useState("");
  const [donorCin, setDonorCin] = useState("");
  const [donationData, setDonationData] = useState({
    donorCin: "",
    bloodType: "",
    collectionDate: new Date().toISOString().split("T")[0],
    expirationDate: "",
  });
  const [recorded, setRecorded] = useState(false);

  const { data: scannedBag, isError: scanError } = useScanBloodBag(
    scanBarcode,
    { query: { enabled: !!scanBarcode } },
  );
  const recordMutation = useRecordDonation();

  const handleScan = () => {
    if (barcode.trim()) setScanBarcode(barcode.trim());
  };

  const generateBarcode = () => {
    const code = `BL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setBarcode(code);
    setDonationData((d) => ({
      ...d,
      expirationDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    }));
  };

  const handleRecord = async () => {
    if (!donationData.donorCin || !donationData.bloodType || !barcode) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    try {
      await recordMutation.mutateAsync({
        data: {
          donorCin: donationData.donorCin,
          barcode,
          bloodType: donationData.bloodType,
          collectionDate: donationData.collectionDate,
          expirationDate: donationData.expirationDate,
        } as any,
      });
      setRecorded(true);
      toast.success("Don enregistré avec succès !");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const reset = () => {
    setBarcode("");
    setScanBarcode("");
    setDonorCin("");
    setDonationData({
      donorCin: "",
      bloodType: "",
      collectionDate: new Date().toISOString().split("T")[0],
      expirationDate: "",
    });
    setRecorded(false);
  };

  const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Collecte de sang
          </h1>
          <p className="text-muted-foreground mt-1">
            Enregistrement d'un don et attribution d'une poche
          </p>
        </div>

        <AnimatePresence mode="wait">
          {recorded ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border-2 border-green-200 rounded-2xl p-10 text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Don enregistré avec succès !
              </h2>
              <p className="text-green-700 mb-2">
                Code barre : <strong className="font-mono">{barcode}</strong>
              </p>
              <Button
                className="mt-4 bg-green-600 text-white hover:bg-green-700"
                onClick={reset}
              >
                Nouveau don
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {/* Barcode scanner */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scan className="w-5 h-5 text-primary" />
                    Scanner / Générer le code-barres
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Scannez ou entrez le code-barres de la poche"
                      className="font-mono"
                    />
                    <Button
                      onClick={handleScan}
                      variant="outline"
                      disabled={!barcode}
                    >
                      Vérifier
                    </Button>
                    <Button
                      onClick={generateBarcode}
                      className="bg-primary text-white hover:bg-primary/90 shrink-0"
                    >
                      Générer
                    </Button>
                  </div>
                  {scannedBag && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                      <p className="text-sm text-orange-800">
                        <strong>Attention :</strong> Cette poche existe déjà
                        dans le système (statut: {(scannedBag as any).status}).
                      </p>
                    </div>
                  )}
                  {scanError && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                      <p className="text-sm text-green-800">
                        Code-barres disponible — aucun doublon détecté.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Donation details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-primary" />
                    Informations du don
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        CIN Donneur *
                      </Label>
                      <Input
                        value={donationData.donorCin}
                        onChange={(e) =>
                          setDonationData((d) => ({
                            ...d,
                            donorCin: e.target.value,
                          }))
                        }
                        placeholder="CIN du donneur"
                        type="text"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Groupe sanguin *
                      </Label>
                      <select
                        value={donationData.bloodType}
                        onChange={(e) =>
                          setDonationData((d) => ({
                            ...d,
                            bloodType: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Sélectionner...</option>
                        {BLOOD_TYPES.map((bt) => (
                          <option key={bt} value={bt}>
                            {bt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Date de collecte *
                      </Label>
                      <Input
                        type="date"
                        value={donationData.collectionDate}
                        onChange={(e) =>
                          setDonationData((d) => ({
                            ...d,
                            collectionDate: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Date d'expiration *
                      </Label>
                      <Input
                        type="date"
                        value={donationData.expirationDate}
                        onChange={(e) =>
                          setDonationData((d) => ({
                            ...d,
                            expirationDate: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
                    onClick={handleRecord}
                    disabled={
                      recordMutation.isPending ||
                      !barcode ||
                      !donationData.donorCin ||
                      !donationData.bloodType
                    }
                  >
                    {recordMutation.isPending
                      ? "Enregistrement..."
                      : "Enregistrer le don"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
