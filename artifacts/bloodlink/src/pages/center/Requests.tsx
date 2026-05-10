import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  AlertTriangle,
  Flame,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import {
  useListBloodRequests,
  useUpdateBloodRequest,
} from "@workspace/api-client-react";
import { toast } from "sonner";

const URGENCY_STYLES: Record<
  string,
  { badge: string; icon: React.ElementType }
> = {
  normal: { badge: "bg-gray-100 text-gray-700", icon: Activity },
  urgent: { badge: "bg-orange-100 text-orange-800", icon: AlertTriangle },
  critical: { badge: "bg-red-100 text-red-800", icon: Flame },
};
const STATUS_LABELS: Record<string, string> = {
  submitted: "Soumis",
  processing: "En cours",
  accepted: "Accepté",
  shipped: "Expédié",
  delivered: "Livré",
  rejected: "Rejeté",
};
const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-teal-100 text-teal-800",
  rejected: "bg-red-100 text-red-800",
};

export default function CenterRequests() {
  const { data, refetch } = useListBloodRequests({ status: "submitted" });
  const { data: allData } = useListBloodRequests({});
  const updateMutation = useUpdateBloodRequest();

  const pending = data?.requests || [];
  const all = allData?.requests || [];

  const handleUpdate = async (id: number, status: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status } });
      toast.success(
        `Demande ${status === "accepted" ? "acceptée" : status === "rejected" ? "rejetée" : "redirigée"}.`,
      );
      refetch();
    } catch {
      toast.error("Erreur.");
    }
  };

  const handleShip = async (id: number) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          status: "shipped",
          estimatedDelivery: new Date(
            Date.now() + 2 * 60 * 60 * 1000,
          ).toISOString(),
        },
      });
      toast.success("Commande expédiée !");
      refetch();
    } catch {
      toast.error("Erreur.");
    }
  };
  const handleDeliver = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: "delivered" } });
      toast.success("Livraison confirmée !");
      refetch();
    } catch {
      toast.error("Erreur.");
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Demandes de sang
          </h1>
          <p className="text-muted-foreground mt-1">
            {pending.length} demande(s) en attente de traitement
          </p>
        </div>

        {/* Pending */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Demandes en attente ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucune demande en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((req: any) => {
                  const urgencyStyle =
                    URGENCY_STYLES[req.urgency] || URGENCY_STYLES.normal;
                  const UrgencyIcon = urgencyStyle.icon;
                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-xl border ${req.urgency === "critical" ? "border-red-300 bg-red-50/30" : req.urgency === "urgent" ? "border-orange-300 bg-orange-50/30" : "border-border bg-muted/20"}`}
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          <BloodTypeBadge type={req.bloodType} />
                          <div>
                            <p className="font-semibold text-foreground">
                              {req.establishmentName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {req.volume} mL · Soumis{" "}
                              {new Date(req.submittedAt).toLocaleDateString(
                                "fr-TN",
                              )}
                            </p>
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mt-1 ${urgencyStyle.badge}`}
                            >
                              <UrgencyIcon className="w-3 h-3" />
                              {req.urgency === "critical"
                                ? "Critique"
                                : req.urgency === "urgent"
                                  ? "Urgent"
                                  : "Normal"}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700 gap-1"
                            onClick={() => handleUpdate(req.id, "accepted")}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50 gap-1"
                            onClick={() => handleUpdate(req.id, "rejected")}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All requests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Toutes les demandes ({all.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-3 font-semibold text-muted-foreground">
                      Établissement
                    </th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">
                      Groupe
                    </th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">
                      Volume
                    </th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">
                      Urgence
                    </th>
                    <th className="text-left pb-3 font-semibold text-muted-foreground">
                      Date
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
                  {all.map((req: any) => (
                    <tr key={req.id} className="hover:bg-muted/30">
                      <td className="py-3 font-medium">
                        {req.establishmentName}
                      </td>
                      <td className="py-3">
                        <BloodTypeBadge type={req.bloodType} size="sm" />
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {req.volume} mL
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${(URGENCY_STYLES[req.urgency] || URGENCY_STYLES.normal).badge}`}
                        >
                          {req.urgency}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(req.submittedAt).toLocaleDateString("fr-TN")}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700"}`}
                        >
                          {STATUS_LABELS[req.status] || req.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {req.status === "accepted" && (
                          <Button
                            size="sm"
                            className="bg-purple-600 text-white hover:bg-purple-700 gap-1"
                            onClick={() => handleShip(req.id)}
                            disabled={updateMutation.isPending}
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Expédier
                          </Button>
                        )}
                        {req.status === "shipped" && (
                          <Button
                            size="sm"
                            className="bg-teal-600 text-white hover:bg-teal-700 gap-1"
                            onClick={() => handleDeliver(req.id)}
                            disabled={updateMutation.isPending}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Marquer livré
                          </Button>
                        )}
                      </td>
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
