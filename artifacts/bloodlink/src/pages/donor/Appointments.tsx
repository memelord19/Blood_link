import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/Layout";
import { useGetAvailableSlots, useCreateAppointment, useListAppointments, useUpdateAppointment } from "@workspace/api-client-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  completed: "bg-blue-100 text-blue-800",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmé", rejected: "Rejeté", cancelled: "Annulé", completed: "Effectué"
};

export default function DonorAppointments() {
  const [showBooking, setShowBooking] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState<string>("all");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const { data: slotsData } = useGetAvailableSlots({});
  const { data: apptData, refetch } = useListAppointments({});
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();

  const slots = slotsData?.slots || [];
  const appointments = apptData?.appointments || [];
  const centers = useMemo(() => {
    const map = new Map<string, string>();
    slots.forEach((slot: any) => {
      if (slot.centerId && slot.centerName) map.set(String(slot.centerId), slot.centerName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [slots]);

  const filteredSlots = selectedCenterId === "all" ? slots : slots.filter((slot: any) => String(slot.centerId) === selectedCenterId);
  const slotsByDate = filteredSlots.reduce((acc: Record<string, typeof filteredSlots>, slot: any) => {
    acc[slot.date] = acc[slot.date] || [];
    acc[slot.date].push(slot);
    return acc;
  }, {});
  const dates = Object.keys(slotsByDate).slice(0, 7);

  const handleBook = async () => {
    if (!selectedSlot) return;
    try {
      await createMutation.mutateAsync({ data: { centerId: selectedSlot.centerId, date: selectedSlot.date, time: selectedSlot.time } });
      toast.success("Rendez-vous demandé avec succès !");
      setShowBooking(false);
      setSelectedSlot(null);
      refetch();
    } catch { toast.error("Erreur lors de la réservation."); }
  };

  const handleCancel = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: "cancelled" } });
      toast.success("Rendez-vous annulé.");
      refetch();
    } catch { toast.error("Erreur lors de l'annulation."); }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rendez-vous</h1>
            <p className="text-muted-foreground mt-1">Gérez vos rendez-vous de don de sang</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white gap-2" onClick={() => setShowBooking(!showBooking)}>
            <Plus className="w-4 h-4" />
            Nouveau rendez-vous
          </Button>
        </div>

        {showBooking && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Choisir un centre et un créneau</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Centre de don</label>
                  <Select value={selectedCenterId} onValueChange={(value) => { setSelectedCenterId(value); setSelectedSlot(null); }}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Sélectionner un centre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les centres</SelectItem>
                      {centers.map(center => (
                        <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto">
                  <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
                    {dates.map(date => {
                      const daySlots = slotsByDate[date];
                      const d = new Date(date);
                      return (
                        <div key={date} className="w-36 shrink-0">
                          <div className="text-xs font-semibold text-muted-foreground mb-2 text-center">
                            {d.toLocaleDateString("fr-TN", { weekday: "short", day: "2-digit", month: "short" })}
                          </div>
                          <div className="space-y-1">
                            {daySlots.slice(0, 4).map((slot: any, i: number) => (
                              <button key={i} type="button" onClick={() => setSelectedSlot(slot)}
                                className={`w-full text-xs py-2 px-2 rounded-lg border transition-colors font-medium ${selectedSlot?.date === slot.date && selectedSlot?.time === slot.time && selectedSlot?.centerId === slot.centerId ? "bg-primary text-white border-primary" : "bg-background hover:border-primary/50 border-border text-foreground"}`}>
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!selectedCenterId || selectedCenterId === "all" ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                    Sélectionnez un centre pour afficher ses créneaux disponibles.
                  </div>
                ) : null}

                {selectedSlot && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-foreground mb-1">Créneau sélectionné :</p>
                    <p className="text-sm text-muted-foreground">
                      <strong>{new Date(selectedSlot.date).toLocaleDateString("fr-TN", { weekday: "long", day: "2-digit", month: "long" })}</strong> à <strong>{selectedSlot.time}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">Centre : {selectedSlot.centerName}</p>
                    <Button className="mt-3 bg-primary hover:bg-primary/90 text-white" onClick={handleBook} disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Réservation..." : "Confirmer le rendez-vous"}
                    </Button>
                  </div>
                )}

                {!selectedSlot && selectedCenterId !== "all" && (
                  <div className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4">
                    Aucun créneau sélectionné pour ce centre.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Mes rendez-vous</CardTitle></CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun rendez-vous pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt: any) => (
                  <div key={appt.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {new Date(appt.date).toLocaleDateString("fr-TN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} à {appt.time}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{appt.centerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[appt.status] || "bg-gray-100 text-gray-700"}`}>
                        {STATUS_LABELS[appt.status] || appt.status}
                      </span>
                      {appt.status === "pending" && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(appt.id)} className="text-destructive hover:text-destructive">
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
