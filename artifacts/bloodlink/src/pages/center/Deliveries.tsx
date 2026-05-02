import React from "react";
import { Truck, Package, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useListBloodRequests, useUpdateBloodRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CenterDeliveries() {
  const { data, refetch } = useListBloodRequests({ status: "shipped" });
  const updateMutation = useUpdateBloodRequest();
  const shipped = data?.requests || [];

  const handleDeliver = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: "delivered" } });
      toast.success("Livraison confirmée !");
      refetch();
    } catch { toast.error("Erreur."); }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suivi des livraisons</h1>
          <p className="text-muted-foreground mt-1">{shipped.length} livraison(s) en cours</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />Livraisons en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shipped.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="w-14 h-14 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucune livraison en cours</p>
              </div>
            ) : (
              <div className="space-y-4">
                {shipped.map((req: any) => (
                  <div key={req.id} className="p-5 bg-muted/20 border border-border rounded-xl">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{req.establishmentName}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <BloodTypeBadge type={req.bloodType} size="sm" />
                            <span className="text-xs text-muted-foreground">{req.volume} mL</span>
                            {req.estimatedDelivery && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                Livraison estimée : {new Date(req.estimatedDelivery).toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">En route</span>
                        <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => handleDeliver(req.id)}>
                          Confirmer livraison
                        </Button>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Expédié</span><span>En route</span><span>Livré</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full bg-purple-500" style={{ width: "66%" }} />
                      </div>
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
