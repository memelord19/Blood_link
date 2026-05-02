import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bell, AlertTriangle, Info, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { Link } from "wouter";
import { toast } from "sonner";

const URGENCY_COLORS: Record<string, string> = {
  critical: "border-red-300 bg-red-50",
  urgent: "border-orange-300 bg-orange-50",
  normal: "border-blue-300 bg-blue-50",
};

export default function DonorNotifications() {
  const { data: notifData, refetch } = useListNotifications({});
  const markReadMutation = useMarkNotificationRead();

  const all = notifData?.notifications || [];
  const shortage = all.filter((n: any) => n.type === "shortage_alert");
  const others = all.filter((n: any) => n.type !== "shortage_alert");

  const handleRead = async (id: number) => {
    try {
      await markReadMutation.mutateAsync({ id });
      refetch();
    } catch {}
  };

  function NotifItem({ n }: { n: any }) {
    return (
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        onClick={() => !n.read && handleRead(n.id)}
        className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all ${n.read ? "opacity-60 bg-muted/30 border-border" : "bg-card border-border hover:border-primary/40 shadow-sm"}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === "shortage_alert" ? "bg-red-100" : "bg-blue-100"}`}>
          {n.type === "shortage_alert" ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <Bell className="w-5 h-5 text-blue-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
            {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{new Date(n.createdAt).toLocaleDateString("fr-TN")}</p>
        </div>
        {n.type === "shortage_alert" && !n.read && (
          <Link href="/donor/appointments">
            <a className="shrink-0 text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-colors" onClick={e => e.stopPropagation()}>
              RDV
            </a>
          </Link>
        )}
      </motion.div>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Centre de notifications</h1>
          <p className="text-muted-foreground mt-1">{notifData?.unreadCount || 0} notification(s) non lue(s)</p>
        </div>

        <Tabs defaultValue="shortage">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="shortage" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alertes de pénurie
              {shortage.filter((n: any) => !n.read).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">{shortage.filter((n: any) => !n.read).length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="others">
              <Bell className="w-4 h-4 mr-1" />
              Autres
            </TabsTrigger>
          </TabsList>
          <TabsContent value="shortage" className="mt-4 space-y-3">
            {shortage.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucune alerte de pénurie active</p>
              </div>
            ) : shortage.map((n: any) => <NotifItem key={n.id} n={n} />)}
          </TabsContent>
          <TabsContent value="others" className="mt-4 space-y-3">
            {others.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucune autre notification</p>
              </div>
            ) : others.map((n: any) => <NotifItem key={n.id} n={n} />)}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
