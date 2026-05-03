import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Truck, Package, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useListBloodRequests } from "@workspace/api-client-react";

const STEPS = ["submitted", "processing", "accepted", "shipped", "delivered"];
const STEP_LABELS = ["Soumise", "En traitement", "Acceptée", "Expédiée", "Livrée"];
const STEP_ICONS = [ClipboardList, Clock, CheckCircle, Truck, Package];
const URGENCY_COLORS: Record<string, string> = {
  normal: "bg-gray-100 text-gray-700", urgent: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800"
};
const URGENCY_LABELS: Record<string, string> = { normal: "Normale", urgent: "Urgente", critical: "Critique" };
const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-gray-100 text-gray-700", processing: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800", shipped: "bg-orange-100 text-orange-800",
  delivered: "bg-teal-100 text-teal-800", rejected: "bg-red-100 text-red-800",
};
const STATUS_LABELS: Record<string, string> = {
  submitted: "En attente", processing: "En traitement",
  accepted: "Acceptée", shipped: "Expédiée", delivered: "Livrée", rejected: "Rejetée"
};

function RequestTracker({ req }: { req: any }) {
  const stepIndex = STEPS.indexOf(req.status);
  const isRejected = req.status === "rejected";

  return (
    <Card className={`border-2 ${req.urgency === "critical" ? "border-red-200" : req.urgency === "urgent" ? "border-orange-200" : "border-border"}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <BloodTypeBadge bloodType={req.bloodType} />
            <div>
              <p className="font-bold text-foreground">{req.bloodType} — {req.volume} mL</p>
              <p className="text-xs text-muted-foreground">Soumis le {new Date(req.submittedAt).toLocaleDateString("fr-TN")}</p>
              {req.centerName && <p className="text-xs text-muted-foreground">Centre : {req.centerName}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${URGENCY_COLORS[req.urgency] || "bg-gray-100 text-gray-700"}`}>
              {URGENCY_LABELS[req.urgency] || req.urgency}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700"}`}>
              {STATUS_LABELS[req.status] || req.status}
            </span>
          </div>
        </div>

        {isRejected ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
            <strong>Demande rejetée.</strong> {req.rejectionReason ? `Motif : ${req.rejectionReason}` : ""}
          </div>
        ) : (
          <>
            <div className="relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted" />
              <div className="absolute top-4 left-4 h-0.5 bg-primary transition-all"
                style={{ width: stepIndex >= 0 ? `${(stepIndex / (STEPS.length - 1)) * (100 - 8)}%` : "0%" }} />
              <div className="flex justify-between relative">
                {STEPS.map((step, i) => {
                  const Icon = STEP_ICONS[i];
                  const done = stepIndex >= i;
                  const current = stepIndex === i;
                  return (
                    <div key={step} className="flex flex-col items-center" style={{ width: `${100 / STEPS.length}%` }}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-all ${done ? "bg-primary border-primary" : "bg-background border-muted-foreground/30"} ${current ? "ring-2 ring-primary/30" : ""}`}>
                        <Icon className={`w-4 h-4 ${done ? "text-white" : "text-muted-foreground/50"}`} />
                      </div>
                      <p className={`text-xs mt-2 text-center font-medium ${done ? "text-primary" : "text-muted-foreground/60"}`}>{STEP_LABELS[i]}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            {req.status === "delivered" && (
              <p className="text-xs text-teal-700 font-medium mt-4 bg-teal-50 px-3 py-2 rounded-lg text-center">
                ✓ La traçabilité de cette demande est finalisée.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClinicTracking() {
  const { data, isLoading } = useListBloodRequests({});
  const requests = data?.requests || [];

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suivi des demandes</h1>
          <p className="text-muted-foreground mt-1">{requests.length} demande(s) au total</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">Aucune demande</p>
            <p className="text-sm mt-1">Soumettez votre première demande de sang.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req: any) => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <RequestTracker req={req} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
