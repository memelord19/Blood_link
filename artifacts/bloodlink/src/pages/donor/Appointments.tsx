import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layout } from "@/components/Layout";
import {
  useGetAvailableSlots,
  useCreateAppointment,
  useListAppointments,
  useUpdateAppointment,
} from "@workspace/api-client-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  completed: "bg-blue-100 text-blue-800",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  rejected: "Rejeté",
  cancelled: "Annulé",
  completed: "Effectué",
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // Monday-based: 0=Mon, 6=Sun
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

export default function DonorAppointments() {
  const today = new Date();
  const [showBooking, setShowBooking] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState<string>("all");
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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
      if (slot.centerId && slot.centerName)
        map.set(String(slot.centerId), slot.centerName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [slots]);

  const filteredSlots = useMemo(
    () =>
      selectedCenterId === "all"
        ? slots
        : slots.filter(
            (slot: any) => String(slot.centerId) === selectedCenterId,
          ),
    [slots, selectedCenterId],
  );

  // Set of date strings that have available slots
  const availableDates = useMemo(
    () => new Set(filteredSlots.map((s: any) => s.date)),
    [filteredSlots],
  );

  // Time slots for the selected date
  const timeSlotsForDate = useMemo(
    () =>
      selectedDate
        ? filteredSlots.filter((s: any) => s.date === selectedDate)
        : [],
    [filteredSlots, selectedDate],
  );

  // Calendar navigation
  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else setCalendarMonth((m) => m - 1);
    setSelectedDate(null);
    setSelectedSlot(null);
  };
  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else setCalendarMonth((m) => m + 1);
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);

  const handleSelectDate = (dateStr: string) => {
    if (!availableDates.has(dateStr)) return;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    try {
      await createMutation.mutateAsync({
        data: {
          centerId: selectedSlot.centerId,
          date: selectedSlot.date,
          time: selectedSlot.time,
        },
      });
      toast.success("Rendez-vous demandé avec succès !");
      setShowBooking(false);
      setSelectedDate(null);
      setSelectedSlot(null);
      refetch();
    } catch {
      toast.error("Erreur lors de la réservation.");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: "cancelled" } });
      toast.success("Rendez-vous annulé.");
      refetch();
    } catch {
      toast.error("Erreur lors de l'annulation.");
    }
  };

  const monthLabel = new Date(
    calendarYear,
    calendarMonth,
    1,
  ).toLocaleDateString("fr-TN", {
    month: "long",
    year: "numeric",
  });

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rendez-vous</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos rendez-vous de don de sang
            </p>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white gap-2"
            onClick={() => {
              setShowBooking(!showBooking);
              setSelectedDate(null);
              setSelectedSlot(null);
            }}
          >
            <Plus className="w-4 h-4" />
            Nouveau rendez-vous
          </Button>
        </div>

        {/* Booking Panel */}
        <AnimatePresence>
          {showBooking && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Choisir un centre et un créneau
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Center selector */}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Centre de don
                    </label>
                    <Select
                      value={selectedCenterId}
                      onValueChange={(value) => {
                        setSelectedCenterId(value);
                        setSelectedDate(null);
                        setSelectedSlot(null);
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Sélectionner un centre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les centres</SelectItem>
                        {centers.map((center) => (
                          <SelectItem key={center.id} value={center.id}>
                            {center.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Calendar */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Sélectionner une date
                    </label>
                    <div className="border border-border rounded-xl overflow-hidden">
                      {/* Month nav */}
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                        <button
                          type="button"
                          onClick={prevMonth}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <span className="text-sm font-semibold text-foreground capitalize">
                          {monthLabel}
                        </span>
                        <button
                          type="button"
                          onClick={nextMonth}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Weekday headers */}
                      <div className="grid grid-cols-7 border-b border-border">
                        {WEEKDAYS.map((d) => (
                          <div
                            key={d}
                            className="text-center text-xs font-semibold text-muted-foreground py-2"
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Days grid */}
                      <div className="grid grid-cols-7 p-1.5 gap-0.5">
                        {/* Empty cells before first day */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                          const isAvailable = availableDates.has(dateStr);
                          const isSelected = selectedDate === dateStr;
                          const isToday =
                            day === today.getDate() &&
                            calendarMonth === today.getMonth() &&
                            calendarYear === today.getFullYear();

                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => handleSelectDate(dateStr)}
                              className={`
                                relative w-8 h-8 flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all
                                ${
                                  isSelected
                                    ? "bg-primary text-white shadow-md"
                                    : isAvailable
                                      ? "hover:bg-primary/10 text-foreground cursor-pointer"
                                      : "text-muted-foreground/40 cursor-default"
                                }
                                ${isToday && !isSelected ? "ring-1 ring-primary ring-offset-1" : ""}
                              `}
                            >
                              {day}
                              {/* Dot indicator for available days */}
                              {isAvailable && !isSelected && (
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/20">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                          Créneaux disponibles
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="w-4 h-4 rounded bg-primary inline-block" />
                          Date sélectionnée
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time slots for selected date */}
                  <AnimatePresence>
                    {selectedDate && selectedCenterId !== "all" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Créneaux disponibles —{" "}
                            {new Date(selectedDate).toLocaleDateString(
                              "fr-TN",
                              {
                                weekday: "long",
                                day: "2-digit",
                                month: "long",
                              },
                            )}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {timeSlotsForDate.map((slot: any, i: number) => {
                              const isChosen =
                                selectedSlot?.date === slot.date &&
                                selectedSlot?.time === slot.time &&
                                selectedSlot?.centerId === slot.centerId;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                    isChosen
                                      ? "bg-primary text-white border-primary shadow-sm"
                                      : "bg-background hover:border-primary/60 border-border text-foreground hover:bg-primary/5"
                                  }`}
                                >
                                  {slot.time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Confirmation panel */}
                  <AnimatePresence>
                    {selectedSlot && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="bg-primary/5 border border-primary/20 rounded-xl p-4"
                      >
                        <p className="text-sm font-semibold text-foreground mb-1">
                          Créneau sélectionné :
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>
                            {new Date(selectedSlot.date).toLocaleDateString(
                              "fr-TN",
                              {
                                weekday: "long",
                                day: "2-digit",
                                month: "long",
                              },
                            )}
                          </strong>{" "}
                          à <strong>{selectedSlot.time}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Centre : {selectedSlot.centerName}
                        </p>
                        <Button
                          className="mt-3 bg-primary hover:bg-primary/90 text-white"
                          onClick={handleBook}
                          disabled={createMutation.isPending}
                        >
                          {createMutation.isPending
                            ? "Réservation..."
                            : "Confirmer le rendez-vous"}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appointments list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mes rendez-vous</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun rendez-vous pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt: any) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {new Date(appt.date).toLocaleDateString("fr-TN", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          à {appt.time}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {appt.centerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[appt.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_LABELS[appt.status] || appt.status}
                      </span>
                      {appt.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(appt.id)}
                          className="text-destructive hover:text-destructive"
                        >
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
