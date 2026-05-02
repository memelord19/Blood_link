import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ClipboardList, Activity, CheckCircle, Truck, AlertTriangle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useGetEstablishmentDashboard, useListBloodRequests } from "@workspace/api-client-react";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Soumis", processing: "En cours", accepted: "Accepté", shipped: "Expédié", delivered: "Livré", rejected: "Rejeté"
};
const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-100 text-yellow-800", processing: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800", shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-teal-100 text-teal-800", rejected: "bg-red-100 text-red-800",
};

export default function EstablishmentDashboard() {
  const { data: dashboard, isLoading } = useGetEstablishmentDashboard();
  const { data: requestsData } = useListBloodRequests({});

  const requests = requestsData?.requests || [];
  const urgentRequests = requests.filter((r: any) => ["urgent", "critical"].includes(r.urgency) && r.status !== "delivered");

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground mt-1">Gestion des demandes de sang et suivi</p>
          </div>
          <Link href="/establishment/request">
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Plus className="w-4 h-4" />Nouvelle demande
            </Button>
          </Link>
        </div>

        {/* Urgent alert */}
        {urgentRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-600 text-white rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p><strong>{urgentRequests.length} demande(s) urgente(s)</strong> nécessitent un suivi immédiat.</p>
          </motion.div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Demandes actives", value: dashboard?.activeRequests || 0, icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "En attente", value: dashboard?.pendingRequests || 0, icon: ClipboardList, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Livrées", value: dashboard?.deliveredRequests || 0, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
            { label: "Demandes urgentes", value: dashboard?.urgentRequests || 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div className="text-3xl font-black text-foreground">{card.value}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">{card.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Demandes récentes</CardTitle>
              <Link href="/establishment/tracking" className="text-sm text-primary hover:underline font-medium">Voir tout</Link>
            </div>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucune demande pour le moment</p>
                <Link href="/establishment/request"><Button className="mt-4 bg-primary text-white hover:bg-primary/90">Faire une demande</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 5).map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <BloodTypeBadge type={req.bloodType} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{req.volume} mL · {req.urgency}</p>
                        <p className="text-xs text-muted-foreground">{new Date(req.submittedAt).toLocaleDateString("fr-TN")}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[req.status] || req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-primary/5 border border-primary/20 rounded-xl p-5 hover:bg-primary/10 transition-colors cursor-pointer" onClick={() => window.location.href = "/establishment/request"}>
            <Plus className="w-8 h-8 text-primary mb-3" />
            <p className="font-bold text-foreground">Nouvelle demande</p>
            <p className="text-xs text-muted-foreground mt-1">Demander du sang au centre</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = "/establishment/tracking"}>
            <Truck className="w-8 h-8 text-blue-500 mb-3" />
            <p className="font-bold text-foreground">Suivi des livraisons</p>
            <p className="text-xs text-muted-foreground mt-1">Suivre mes commandes</p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
