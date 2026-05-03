import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ClipboardList, Activity, CheckCircle, Truck, AlertTriangle, Plus, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useGetEstablishmentDashboard, useListBloodRequests } from "@workspace/api-client-react";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Soumis", processing: "En cours", accepted: "Accepté",
  shipped: "Expédié", delivered: "Livré", rejected: "Rejeté"
};
const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-100 text-yellow-800", processing: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800", shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-teal-100 text-teal-800", rejected: "bg-red-100 text-red-800",
};
const STEPS = ["submitted", "processing", "accepted", "shipped", "delivered"];
const STEP_LABELS = ["Soumis", "En cours", "Accepté", "Expédié", "Livré"];

export default function HospitalDashboard() {
  const { data: dashboard } = useGetEstablishmentDashboard();
  const { data: requestsData } = useListBloodRequests({});
  const requests = requestsData?.requests || [];
  const urgentRequests = requests.filter((r: any) => ["urgent", "critical"].includes(r.urgency) && r.status !== "delivered");
  const recentRequests = requests.slice(0, 3);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground mt-1">Gestion des demandes de sang — Hôpital</p>
          </div>
          <Link href="/hospital/request">
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Plus className="w-4 h-4" />Nouvelle demande
            </Button>
          </Link>
        </div>

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
            { label: "Urgentes", value: dashboard?.urgentRequests || 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
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

        {/* No internal blood bank notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Cet hôpital ne dispose pas d'une banque de sang interne. Les demandes sont transmises directement au centre de transfusion.
          </p>
        </div>

        {/* Step tracker for recent requests */}
        {recentRequests.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Suivi des 3 dernières demandes</CardTitle>
                <Link href="/hospital/tracking" className="text-sm text-primary hover:underline font-medium">Voir tout</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {recentRequests.map((req: any) => {
                const stepIndex = STEPS.indexOf(req.status);
                return (
                  <div key={req.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BloodTypeBadge bloodType={req.bloodType} />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{req.bloodType} — {req.volume} mL</p>
                          <p className="text-xs text-muted-foreground">{new Date(req.submittedAt).toLocaleDateString("fr-TN")}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700"}`}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute top-3.5 left-3.5 right-3.5 h-0.5 bg-muted" />
                      <div className="absolute top-3.5 left-3.5 h-0.5 bg-primary transition-all"
                        style={{ width: stepIndex >= 0 ? `${(stepIndex / (STEPS.length - 1)) * 90}%` : "0%" }} />
                      <div className="flex justify-between relative">
                        {STEPS.map((step, i) => {
                          const done = stepIndex >= i;
                          return (
                            <div key={step} className="flex flex-col items-center" style={{ width: `${100 / STEPS.length}%` }}>
                              <div className={`w-7 h-7 rounded-full border-2 z-10 flex items-center justify-center ${done ? "bg-primary border-primary" : "bg-background border-muted-foreground/30"}`}>
                                <div className={`w-2 h-2 rounded-full ${done ? "bg-white" : "bg-muted-foreground/30"}`} />
                              </div>
                              <p className={`text-xs mt-1.5 text-center font-medium ${done ? "text-primary" : "text-muted-foreground/60"}`}>{STEP_LABELS[i]}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.02 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-5 hover:bg-primary/10 transition-colors cursor-pointer"
            onClick={() => window.location.href = "/hospital/request"}>
            <Plus className="w-8 h-8 text-primary mb-3" />
            <p className="font-bold text-foreground">Nouvelle demande de sang</p>
            <p className="text-xs text-muted-foreground mt-1">Soumettre une demande au centre</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer"
            onClick={() => window.location.href = "/hospital/tracking"}>
            <Truck className="w-8 h-8 text-blue-500 mb-3" />
            <p className="font-bold text-foreground">Suivi des livraisons</p>
            <p className="text-xs text-muted-foreground mt-1">Suivre mes demandes en cours</p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
