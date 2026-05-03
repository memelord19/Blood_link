import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, Calendar, FileText, Bell, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useGetDonorDashboard, useGetCurrentUser, useListDonations } from "@workspace/api-client-react";

const STATUS_CONFIG = {
  eligible: { label: "Éligible", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 border-green-200", badge: "bg-green-100 text-green-800" },
  temporarily_excluded: { label: "Temporairement exclu", icon: Clock, color: "text-orange-600", bg: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-800" },
  permanently_ineligible: { label: "Définitivement inapte", icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-800" },
};

export default function DonorDashboard() {
  const { data: dashboard, isLoading } = useGetDonorDashboard();
  const { data: user } = useGetCurrentUser();
  const { data: donationsData } = useListDonations({});

  const status = dashboard?.eligibilityStatus || "eligible";
  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.eligible;
  const StatusIcon = statusConfig.icon;
  const lastDonation = donationsData?.donations?.[0];

  const quickActions = [
    { href: "/donor/appointments", label: "Prendre rendez-vous", icon: Calendar, desc: "Réserver un créneau" },
    { href: "/donor/medical-form", label: "Formulaire médical", icon: FileText, desc: "Vérifier mon éligibilité" },
    { href: "/donor/history", label: "Mes dons", icon: Heart, desc: "Voir l'historique" },
    { href: "/donor/notifications", label: "Notifications", icon: Bell, desc: `${dashboard?.unreadAlerts || 0} non lues`, badge: dashboard?.unreadAlerts },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bonjour, {(user as any)?.firstName || "Donneur"} 👋</h1>
          <p className="text-muted-foreground mt-1">Voici votre espace personnel BloodLink</p>
          {user?.bloodType ? <div className="mt-3"><BloodTypeBadge bloodType={user.bloodType} /></div> : null}
        </div>

        {/* Status card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border-2 p-6 ${statusConfig.bg}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${statusConfig.bg} border ${statusConfig.color.replace("text-", "border-").replace("-600", "-300")}`}>
              <StatusIcon className={`w-8 h-8 ${statusConfig.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="text-lg font-bold text-foreground">Statut d'éligibilité</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusConfig.badge}`}>{statusConfig.label}</span>
              </div>
              {dashboard?.nextDonationDate && status !== "eligible" ? (
                <p className="text-sm text-muted-foreground">Prochaine date possible : <strong>{new Date(dashboard.nextDonationDate).toLocaleDateString("fr-TN")}</strong></p>
              ) : status === "eligible" ? (
                <p className="text-sm text-green-700 font-medium">Vous pouvez donner votre sang dès maintenant !</p>
              ) : null}
            </div>
            {status === "eligible" && (
              <Link href="/donor/appointments">
                <Button className="bg-green-600 hover:bg-green-700 text-white shrink-0">Prendre rendez-vous</Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total des dons", value: dashboard?.totalDonations || 0, icon: Heart, color: "text-red-500", bg: "bg-red-50" },
            { label: "Alertes non lues", value: dashboard?.unreadAlerts || 0, icon: Bell, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "Quota annuel", value: `${dashboard?.annualDonations || 0}/${dashboard?.annualQuota || 5}`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Dernier don", value: lastDonation?.date ? new Date(lastDonation.date).toLocaleDateString("fr-TN", { day: "2-digit", month: "short" }) : dashboard?.lastDonationDate ? new Date(dashboard.lastDonationDate).toLocaleDateString("fr-TN", { day: "2-digit", month: "short" }) : "—", icon: Calendar, color: "text-green-500", bg: "bg-green-50" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-black text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Annual quota progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quota annuel de dons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{dashboard?.annualDonations || 0} dons effectués</span>
                  <span className="font-semibold text-foreground">{dashboard?.annualQuota || 5} max / an</span>
                </div>
                <Progress value={((dashboard?.annualDonations || 0) / (dashboard?.annualQuota || 5)) * 100} className="h-3" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Il vous reste <strong>{(dashboard?.annualQuota || 5) - (dashboard?.annualDonations || 0)}</strong> dons possibles cette année.
            </p>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.href}>
                <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="block bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer relative">
                  {action.badge ? (
                    <span className="absolute top-3 right-3 w-5 h-5 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {action.badge}
                    </span>
                  ) : null}
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-semibold text-sm text-foreground">{action.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{action.desc}</div>
                </motion.a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
