import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Heart, Calendar, History, Bell, Users, ClipboardList,
  Package, AlertTriangle, Truck, FileText, LogOut, Menu, X, Droplet,
  Activity, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BloodLinkLogo } from "@/components/BloodLinkLogo";
import { useListNotifications } from "@workspace/api-client-react";

const ROLE_LABELS: Record<string, string> = {
  donor: "Donneur",
  transfusion_center: "Centre de Transfusion",
  blood_bank: "Banque de Sang",
  hospital: "Hôpital",
  clinic: "Clinique",
};

const ROLE_COLORS: Record<string, string> = {
  donor: "bg-red-100 text-red-800",
  transfusion_center: "bg-blue-100 text-blue-800",
  blood_bank: "bg-teal-100 text-teal-800",
  hospital: "bg-orange-100 text-orange-800",
  clinic: "bg-purple-100 text-purple-800",
};

function getDonorNav() {
  return [
    { href: "/donor/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/donor/medical-form", label: "Formulaire médical", icon: ClipboardList },
    { href: "/donor/appointments", label: "Rendez-vous", icon: Calendar },
    { href: "/donor/history", label: "Historique", icon: History },
    { href: "/donor/notifications", label: "Notifications", icon: Bell },
  ];
}

function getCenterNav(role: string) {
  const base = [
    { href: "/center/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/center/donors", label: "Donneurs", icon: Users },
    { href: "/center/appointments", label: "Rendez-vous", icon: Calendar },
    { href: "/center/stock", label: "Stock", icon: Package },
    { href: "/center/requests", label: "Demandes", icon: ClipboardList },
    { href: "/center/alerts", label: "Alertes", icon: AlertTriangle },
  ];
  if (role === "transfusion_center") {
    base.splice(3, 0, { href: "/center/collection", label: "Collecte", icon: Droplet });
    base.push({ href: "/center/deliveries", label: "Livraisons", icon: Truck });
  }
  if (role === "blood_bank") {
    base.splice(3, 0, { href: "/center/reception", label: "Réception", icon: Activity });
  }
  return base;
}

function getEstablishmentNav(role: string) {
  const base = [
    { href: "/establishment/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/establishment/request", label: "Demande de sang", icon: Heart },
    { href: "/establishment/tracking", label: "Suivi demandes", icon: Activity },
  ];
  if (role === "clinic") {
    base.push({ href: "/establishment/invoices", label: "Factures", icon: FileText });
  }
  return base;
}

function getNavItems(role: string) {
  if (role === "donor") return getDonorNav();
  if (role === "transfusion_center" || role === "blood_bank") return getCenterNav(role);
  if (role === "hospital" || role === "clinic") return getEstablishmentNav(role);
  return [];
}

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const [location] = useLocation();
  const isActive = location === href || location.startsWith(href + "/");
  return (
    <Link href={href}>
      <a className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}>
        <Icon className="w-5 h-5 shrink-0" />
        <span>{label}</span>
      </a>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState<"FR" | "AR">("FR");
  const { data: notifData } = useListNotifications({ read: false }, { query: { refetchInterval: 30000 } });
  const unreadCount = notifData?.unreadCount || 0;

  if (!user) return null;

  const navItems = getNavItems(user.role);

  const Sidebar = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/">
          <a className="flex items-center gap-3">
            <BloodLinkLogo className="w-8 h-8" />
            <span className="text-xl font-bold text-white">BloodLink</span>
          </a>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.href} {...item} />)}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</div>
            <div className={cn("text-xs px-1.5 py-0.5 rounded-full mt-0.5 inline-block", ROLE_COLORS[user.role])}>
              {ROLE_LABELS[user.role]}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="w-full text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent justify-start gap-2">
          <LogOut className="w-4 h-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 shrink-0 flex-col">
        {Sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex flex-col">{Sidebar}</div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <BloodLinkLogo className="w-6 h-6" />
              <span className="font-semibold text-foreground">BloodLink</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 mr-2">
              <button onClick={() => setLang("FR")} className={cn("text-xs px-2 py-1 rounded font-medium", lang === "FR" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>FR</button>
              <button onClick={() => setLang("AR")} className={cn("text-xs px-2 py-1 rounded font-medium", lang === "AR" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>AR</button>
            </div>
            <Link href={user.role === "donor" ? "/donor/notifications" : "#"}>
              <a className="relative p-2 hover:bg-accent rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </a>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <span className="hidden sm:inline font-medium text-foreground">{user.firstName} {user.lastName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
