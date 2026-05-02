import React from "react";
import { motion } from "framer-motion";
import { Package, Calendar, ClipboardList, AlertTriangle, Droplet, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { useGetCenterDashboard } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const BT_COLORS: Record<string, string> = {
  "A+": "#C0392B", "A-": "#E74C3C", "B+": "#2980B9", "B-": "#3498DB",
  "AB+": "#8E44AD", "AB-": "#9B59B6", "O+": "#27AE60", "O-": "#2ECC71",
};

const STATUS_STYLES: Record<string, { bar: string; badge: string; label: string }> = {
  ok: { bar: "bg-green-500", badge: "bg-green-100 text-green-800", label: "OK" },
  warning: { bar: "bg-orange-500", badge: "bg-orange-100 text-orange-800", label: "Faible" },
  critical: { bar: "bg-red-500", badge: "bg-red-100 text-red-800", label: "Critique" },
};

export default function CenterDashboard() {
  const { data, isLoading } = useGetCenterDashboard();

  const hasCritical = (data?.criticalStockTypes?.length || 0) > 0;

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Critical alert banner */}
        {hasCritical && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-600 text-white rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold">Alerte stock critique !</p>
              <p className="text-sm text-red-100">
                Groupes critiques : {data?.criticalStockTypes?.join(", ")}. Action immédiate requise.
              </p>
            </div>
          </motion.div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble du centre de sang</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "RDV en attente", value: data?.pendingAppointments || 0, icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Demandes en attente", value: data?.pendingRequests || 0, icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "Dons aujourd'hui", value: data?.totalDonationsToday || 0, icon: Droplet, color: "text-red-500", bg: "bg-red-50" },
            { label: "Alertes actives", value: data?.activeAlerts || 0, icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50" },
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

        {/* Stock levels */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Niveaux de stock par groupe sanguin
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(data?.stockLevels || []).map((level: any) => {
                  const s = STATUS_STYLES[level.status] || STATUS_STYLES.ok;
                  const pct = Math.min(100, Math.round((level.available / (level.threshold * 2)) * 100));
                  return (
                    <div key={level.bloodType} className="bg-muted/30 rounded-xl p-4 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm" style={{ background: BT_COLORS[level.bloodType] }}>
                          {level.bloodType}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.badge}`}>{s.label}</span>
                      </div>
                      <div className="text-2xl font-black text-foreground mb-1">{level.available}</div>
                      <div className="text-xs text-muted-foreground mb-2">poches disponibles</div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${s.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      {level.expiringSoon > 0 && (
                        <p className="text-xs text-orange-600 font-medium mt-1.5">{level.expiringSoon} expirent bientôt</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
