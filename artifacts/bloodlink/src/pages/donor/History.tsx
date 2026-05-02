import React from "react";
import { Droplet, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/Layout";
import { useListDonations, useGetDonorDashboard } from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, string> = {
  collected: "bg-blue-100 text-blue-800",
  qualified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};
const STATUS_LABELS: Record<string, string> = {
  collected: "Collecté", qualified: "Qualifié", rejected: "Rejeté"
};

export default function DonationHistory() {
  const { data: donationsData, isLoading } = useListDonations({});
  const { data: dashboard } = useGetDonorDashboard();

  const donations = donationsData?.donations || [];

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historique des dons</h1>
          <p className="text-muted-foreground mt-1">Retrouvez l'ensemble de vos dons de sang</p>
        </div>

        {/* Annual progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Progression annuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-3xl font-black text-primary">{dashboard?.annualDonations || 0}</span>
              <span className="text-muted-foreground text-sm">/ {dashboard?.annualQuota || 5} dons cette année</span>
            </div>
            <Progress value={((dashboard?.annualDonations || 0) / (dashboard?.annualQuota || 5)) * 100} className="h-4" />
            <p className="text-xs text-muted-foreground mt-2">
              Quota annuel : maximum {dashboard?.annualQuota || 5} dons — Intervalle minimum : 56 jours entre chaque don
            </p>
          </CardContent>
        </Card>

        {/* Donations table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tous les dons ({donations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Droplet className="w-14 h-14 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucun don enregistré</p>
                <p className="text-sm mt-1">Prenez un rendez-vous pour commencer votre parcours de donneur.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left pb-3 font-semibold text-muted-foreground">Date</th>
                      <th className="text-left pb-3 font-semibold text-muted-foreground">Centre</th>
                      <th className="text-left pb-3 font-semibold text-muted-foreground">ID Poche</th>
                      <th className="text-left pb-3 font-semibold text-muted-foreground">Groupe</th>
                      <th className="text-left pb-3 font-semibold text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {donations.map((d: any) => (
                      <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-medium">{new Date(d.donationDate).toLocaleDateString("fr-TN")}</td>
                        <td className="py-3 text-muted-foreground">{d.centerName}</td>
                        <td className="py-3 font-mono text-xs text-muted-foreground">{d.bloodBagBarcode || `#${d.id}`}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-xs">{d.bloodType}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-700"}`}>
                            {STATUS_LABELS[d.status] || d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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
