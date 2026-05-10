import {
  Switch,
  Route,
  Router as WouterRouter,
  Redirect,
  useLocation,
} from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { setAuthTokenGetter } from "@workspace/api-client-react";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import DonorDashboard from "@/pages/donor/Dashboard";
import MedicalForm from "@/pages/donor/MedicalForm";
import DonorAppointments from "@/pages/donor/Appointments";
import DonationHistory from "@/pages/donor/History";
import DonorNotifications from "@/pages/donor/Notifications";
import CenterDashboard from "@/pages/center/Dashboard";
import CenterDonors from "@/pages/center/Donors";
import CenterAppointments from "@/pages/center/Appointments";
import CenterCollection from "@/pages/center/Collection";
import CenterReception from "@/pages/center/Reception";
import CenterStock from "@/pages/center/Stock";
import CenterRequests from "@/pages/center/Requests";
import CenterDeliveries from "@/pages/center/Deliveries";
import CenterAlerts from "@/pages/center/Alerts";
import HospitalDashboard from "@/pages/hospital/Dashboard";
import HospitalRequest from "@/pages/hospital/Request";
import HospitalTracking from "@/pages/hospital/Tracking";
import HospitalNotifications from "@/pages/hospital/Notifications";
import ClinicDashboard from "@/pages/clinic/Dashboard";
import ClinicRequest from "@/pages/clinic/Request";
import ClinicTracking from "@/pages/clinic/Tracking";
import ClinicInvoices from "@/pages/clinic/Invoices";
import ClinicNotifications from "@/pages/clinic/Notifications";
import EstablishmentDashboard from "@/pages/establishment/Dashboard";
import EstablishmentRequest from "@/pages/establishment/Request";
import EstablishmentTracking from "@/pages/establishment/Tracking";
import EstablishmentInvoices from "@/pages/establishment/Invoices";
import BloodBagScan from "@/pages/shared/BloodBagScan";
import NotFound from "@/pages/not-found";

setAuthTokenGetter(() => localStorage.getItem("bl_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30 * 1000 },
  },
});

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">
            Chargement...
          </p>
        </div>
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  if (roles && !roles.includes(user.role)) return <Redirect to="/" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Donor */}
      <Route path="/donor/dashboard">
        <ProtectedRoute roles={["donor"]}>
          <DonorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/donor/medical-form">
        <ProtectedRoute roles={["donor"]}>
          <MedicalForm />
        </ProtectedRoute>
      </Route>
      <Route path="/donor/appointments">
        <ProtectedRoute roles={["donor"]}>
          <DonorAppointments />
        </ProtectedRoute>
      </Route>
      <Route path="/donor/history">
        <ProtectedRoute roles={["donor"]}>
          <DonationHistory />
        </ProtectedRoute>
      </Route>
      <Route path="/donor/notifications">
        <ProtectedRoute roles={["donor"]}>
          <DonorNotifications />
        </ProtectedRoute>
      </Route>

      {/* Center */}
      <Route path="/center/dashboard">
        <ProtectedRoute roles={["transfusion_center", "blood_bank"]}>
          <CenterDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/center/donors">
        <ProtectedRoute roles={["transfusion_center", "blood_bank"]}>
          <CenterDonors />
        </ProtectedRoute>
      </Route>
      <Route path="/center/appointments">
        <ProtectedRoute roles={["transfusion_center", "blood_bank"]}>
          <CenterAppointments />
        </ProtectedRoute>
      </Route>
      <Route path="/center/collection">
        <ProtectedRoute roles={["transfusion_center"]}>
          <CenterCollection />
        </ProtectedRoute>
      </Route>
      <Route path="/center/reception">
        <ProtectedRoute roles={["blood_bank"]}>
          <CenterReception />
        </ProtectedRoute>
      </Route>
      <Route path="/center/stock">
        <ProtectedRoute roles={["transfusion_center", "blood_bank"]}>
          <CenterStock />
        </ProtectedRoute>
      </Route>
      <Route path="/center/requests">
        <ProtectedRoute roles={["transfusion_center", "blood_bank"]}>
          <CenterRequests />
        </ProtectedRoute>
      </Route>
      <Route path="/center/deliveries">
        <ProtectedRoute roles={["transfusion_center"]}>
          <CenterDeliveries />
        </ProtectedRoute>
      </Route>
      <Route path="/center/alerts">
        <ProtectedRoute roles={["transfusion_center", "blood_bank"]}>
          <CenterAlerts />
        </ProtectedRoute>
      </Route>

      {/* Hospital (dedicated routes) */}
      <Route path="/hospital/dashboard">
        <ProtectedRoute roles={["hospital"]}>
          <HospitalDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/hospital/request">
        <ProtectedRoute roles={["hospital"]}>
          <HospitalRequest />
        </ProtectedRoute>
      </Route>
      <Route path="/hospital/tracking">
        <ProtectedRoute roles={["hospital"]}>
          <HospitalTracking />
        </ProtectedRoute>
      </Route>
      <Route path="/hospital/notifications">
        <ProtectedRoute roles={["hospital"]}>
          <HospitalNotifications />
        </ProtectedRoute>
      </Route>
      <Route path="/hospital/scan">
        <ProtectedRoute roles={["hospital"]}>
          <BloodBagScan />
        </ProtectedRoute>
      </Route>

      {/* Clinic (dedicated routes) */}
      <Route path="/clinic/dashboard">
        <ProtectedRoute roles={["clinic"]}>
          <ClinicDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/clinic/request">
        <ProtectedRoute roles={["clinic"]}>
          <ClinicRequest />
        </ProtectedRoute>
      </Route>
      <Route path="/clinic/scan">
        <ProtectedRoute roles={["clinic"]}>
          <BloodBagScan />
        </ProtectedRoute>
      </Route>
      <Route path="/clinic/tracking">
        <ProtectedRoute roles={["clinic"]}>
          <ClinicTracking />
        </ProtectedRoute>
      </Route>
      <Route path="/clinic/invoices">
        <ProtectedRoute roles={["clinic"]}>
          <ClinicInvoices />
        </ProtectedRoute>
      </Route>
      <Route path="/clinic/notifications">
        <ProtectedRoute roles={["clinic"]}>
          <ClinicNotifications />
        </ProtectedRoute>
      </Route>

      {/* Legacy establishment routes — keep for backward compat */}
      <Route path="/establishment/dashboard">
        <ProtectedRoute roles={["hospital", "clinic"]}>
          <EstablishmentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/establishment/request">
        <ProtectedRoute roles={["hospital", "clinic"]}>
          <EstablishmentRequest />
        </ProtectedRoute>
      </Route>
      <Route path="/establishment/tracking">
        <ProtectedRoute roles={["hospital", "clinic"]}>
          <EstablishmentTracking />
        </ProtectedRoute>
      </Route>
      <Route path="/establishment/invoices">
        <ProtectedRoute roles={["clinic"]}>
          <EstablishmentInvoices />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base="">
          <AppWithAuth />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
