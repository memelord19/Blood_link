import React from "react";
import { motion } from "framer-motion";
import { Bell, AlertTriangle, CheckCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";

export default function ClinicNotifications() {
  const { data: notifData, refetch } = useListNotifications({});
  const markReadMutation = useMarkNotificationRead();
  const all = notifData?.notifications || [];

  const handleRead = async (id: number) => {
    try { await markReadMutation.mutateAsync({ id }); refetch(); } catch {}
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">{notifData?.unreadCount || 0} non lue(s)</p>
        </div>

        {all.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-3">
            {all.map((n: any) => (
              <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all ${n.read ? "opacity-60 bg-muted/30 border-border" : "bg-card border-border hover:border-primary/40 shadow-sm"}`}
                onClick={() => !n.read && handleRead(n.id)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === "shortage_alert" ? "bg-red-100" : "bg-blue-100"}`}>
                  {n.type === "shortage_alert" ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <Bell className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground/60">{new Date(n.createdAt).toLocaleDateString("fr-TN")}</p>
                    {!n.read && (
                      <button onClick={e => { e.stopPropagation(); handleRead(n.id); }}
                        className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />Marquer comme lu
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
