import React, { useState } from "react";
import { Package, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useListBloodBags, useGetStock } from "@workspace/api-client-react";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUS_LABELS: Record<string, string> = { available: "Disponible", reserved: "Réservé", transfused: "Transfusé", expired: "Expiré", rejected: "Rejeté" };
const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800", reserved: "bg-blue-100 text-blue-800",
  transfused: "bg-gray-100 text-gray-800", expired: "bg-red-100 text-red-800", rejected: "bg-orange-100 text-orange-800"
};

export default function CenterStock() {
  const [filterBt, setFilterBt] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterExp, setFilterExp] = useState("");

  const { data: bagsData, isLoading } = useListBloodBags({
    bloodType: filterBt !== "all" ? filterBt : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
    expiringBefore: filterExp || undefined,
  });
  const { data: stockData } = useGetStock({});
  const bags = bagsData?.bloodBags || [];
  const levels = stockData?.levels || [];

  const today = new Date();
  const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion du stock</h1>
          <p className="text-muted-foreground mt-1">Vue détaillée de l'inventaire des poches de sang</p>
        </div>

        {/* Stock summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {levels.slice(0, 8).map((level: any) => (
            <div key={level.bloodType} className={`rounded-xl p-4 border-2 ${level.status === "critical" ? "bg-red-50 border-red-200" : level.status === "warning" ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <BloodTypeBadge type={level.bloodType} size="sm" />
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${level.status === "critical" ? "bg-red-100 text-red-800" : level.status === "warning" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}>
                  {level.status === "critical" ? "Critique" : level.status === "warning" ? "Faible" : "OK"}
                </span>
              </div>
              <div className="text-2xl font-black text-foreground">{level.available}</div>
              <div className="text-xs text-muted-foreground">poches dispo.</div>
              {level.expiringSoon > 0 && <div className="text-xs text-orange-600 font-medium mt-1">{level.expiringSoon} expirent bientôt</div>}
            </div>
          ))}
        </div>

        {/* Bags table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Inventaire ({bags.length} poches)</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Select onValueChange={setFilterBt}>
                  <SelectTrigger className="w-24"><SelectValue placeholder="Groupe" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Tous</SelectItem>{BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent>
                </Select>
                <Select onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="reserved">Réservé</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={filterExp} onChange={e => setFilterExp(e.target.value)} placeholder="Expire avant" className="w-40 text-xs" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="text-left pb-3 font-semibold text-muted-foreground">Code-barres</th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">Groupe</th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">Collecté le</th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">Expire le</th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">Centre</th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">Statut</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {bags.length === 0 ? (
                      <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Aucune poche trouvée</td></tr>
                    ) : bags.map((bag: any) => {
                      const expiring = bag.expirationDate <= sevenDays && bag.status === "available";
                      return (
                        <tr key={bag.id} className={`hover:bg-muted/30 transition-colors ${expiring ? "bg-orange-50/50" : ""}`}>
                          <td className="py-3 font-mono text-xs">{bag.barcode} {expiring && <AlertTriangle className="inline w-3 h-3 text-orange-500 ml-1" />}</td>
                          <td className="py-3"><BloodTypeBadge type={bag.bloodType} size="sm" /></td>
                          <td className="py-3 text-muted-foreground">{bag.collectionDate}</td>
                          <td className={`py-3 font-medium ${expiring ? "text-orange-600" : "text-foreground"}`}>{bag.expirationDate}</td>
                          <td className="py-3 text-muted-foreground text-xs">{bag.centerName}</td>
                          <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[bag.status] || "bg-gray-100 text-gray-700"}`}>{STATUS_LABELS[bag.status] || bag.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
