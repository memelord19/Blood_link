import React from "react";
import { Calendar, CheckCircle, XCircle, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { useListAppointments, useUpdateAppointment } from "@workspace/api-client-react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  completed: "bg-blue-100 text-blue-800",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmé", rejected: "Rejeté", cancelled: "Annulé", completed: "Effectué"
};

export default function CenterAppointments() {
  const { data, refetch } = useListAppointments({ status: "pending" });
  const { data: allData } = useListAppointments({});
  const updateMutation = useUpdateAppointment();

  const pending = data?.appointments || [];
  const all = allData?.appointments || [];

  const handleUpdate = async (id: number, status: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status } });
      toast.success(status === "confirmed" ? "Rendez-vous confirmé !" : "Rendez-vous rejeté.");
      refetch();
    } catch { toast.error("Erreur lors de la mise à jour."); }
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des rendez-vous</h1>
          <p className="text-muted-foreground mt-1">{pending.length} rendez-vous en attente de confirmation</p>
        </div>

        {/* Pending */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              En attente de confirmation ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucun rendez-vous en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((appt: any) => (
                  <div key={appt.id} className="flex items-center justify-between p-4 bg-yellow-50/50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-yellow-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{appt.donorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appt.date).toLocaleDateString("fr-TN", { weekday: "long", day: "2-digit", month: "long" })} à {appt.time}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{appt.centerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => handleUpdate(appt.id, "confirmed")} disabled={updateMutation.isPending}>
                        <CheckCircle className="w-4 h-4" />Confirmer
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 gap-1" onClick={() => handleUpdate(appt.id, "rejected")} disabled={updateMutation.isPending}>
                        <XCircle className="w-4 h-4" />Rejeter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All appointments */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Tous les rendez-vous ({all.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left pb-3 font-semibold text-muted-foreground">Donneur</th>
                  <th className="text-left pb-3 font-semibold text-muted-foreground">Date & Heure</th>
                  <th className="text-left pb-3 font-semibold text-muted-foreground">Centre</th>
                  <th className="text-left pb-3 font-semibold text-muted-foreground">Statut</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {all.map((appt: any) => (
                    <tr key={appt.id} className="hover:bg-muted/30">
                      <td className="py-3 font-medium">{appt.donorName}</td>
                      <td className="py-3 text-muted-foreground text-xs">{new Date(appt.date).toLocaleDateString("fr-TN")} {appt.time}</td>
                      <td className="py-3 text-muted-foreground text-xs">{appt.centerName}</td>
                      <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[appt.status] || "bg-gray-100 text-gray-700"}`}>{STATUS_LABELS[appt.status]}</span></td>
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
