import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Heart, Calendar, History, Bell, Users, ClipboardList,
  Package, AlertTriangle, Truck, FileText, LogOut, Menu, Droplet,
  Activity, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BloodLinkLogo } from "@/components/BloodLinkLogo";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { useListNotifications } from "@workspace/api-client-react";

const ROLE_LABELS: Record<string, string> = {
  donor: "Donneur",
  transfusion_center: "Centre de Transfusion",
  blood_bank: "Banque de Sang",
  hospital: "Hôpital",
  clinic: "Clinique",
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  donor: "bg-red-100 text-red-800",
  transfusion_center: "bg-blue-100 text-blue-800",
  blood_bank: "bg-purple-100 text-purple-800",
  hospital: "bg-green-100 text-green-800",
  clinic: "bg-teal-100 text-teal-800",
};

function getNavItems(role: string) {
  if (role === "donor") {
    return [
      { href: "/donor/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/donor/medical-form", label: "Formulaire médical", icon: ClipboardList },
      { href: "/donor/appointments", label: "Rendez-vous", icon: Calendar },
      { href: "/donor/history", label: "Historique", icon: History },
      { href: "/donor/notifications", label: "Notifications", icon: Bell },
    ];
  }
  if (role === "transfusion_center") {
    return [
      { href: "/center/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/center/donors", label: "Inscrire un Donneur", icon: Users },
      { href: "/center/appointments", label: "Gestion Rendez-vous", icon: Calendar },
      { href: "/center/collection", label: "Collecte de sang", icon: Droplet },
      { href: "/center/stock", label: "Vérifier Stock", icon: Package },
      { href: "/center/requests", label: "Demandes Établissements", icon: ClipboardList },
      { href: "/center/deliveries", label: "Suivre les Livraisons", icon: Truck },
      { href: "/center/alerts", label: "Alertes reçues", icon: AlertTriangle },
    ];
  }
  if (role === "blood_bank") {
    return [
      { href: "/center/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/center/donors", label: "Inscrire un Donneur", icon: Users },
      { href: "/center/appointments", label: "Gestion Rendez-vous", icon: Calendar },
      { href: "/center/reception", label: "Réception de Poches", icon: Activity },
      { href: "/center/stock", label: "Vérifier Stock", icon: Package },
      { href: "/center/requests", label: "Demandes Établissements", icon: ClipboardList },
      { href: "/center/alerts", label: "Envoyer Alertes", icon: AlertTriangle },
    ];
  }
  if (role === "hospital") {
    return [
      { href: "/hospital/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/hospital/request", label: "Nouvelle demande de sang", icon: Heart },
      { href: "/hospital/tracking", label: "Suivi des demandes", icon: Activity },
      { href: "/hospital/notifications", label: "Notifications", icon: Bell },
    ];
  }
  if (role === "clinic") {
    return [
      { href: "/clinic/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/clinic/request", label: "Nouvelle demande de sang", icon: Heart },
      { href: "/clinic/tracking", label: "Suivi des demandes", icon: Activity },
      { href: "/clinic/invoices", label: "Paiement des factures", icon: CreditCard },
      { href: "/clinic/notifications", label: "Notifications", icon: Bell },
    ];
  }
  return [];
}

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const [location] = useLocation();
  const isActive = location === href || location.startsWith(href + "/");
  return (
    <Link href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}>
      <Icon className="w-5 h-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function getNotifPath(role: string) {
  if (role === "donor") return "/donor/notifications";
  if (role === "hospital") return "/hospital/notifications";
  if (role === "clinic") return "/clinic/notifications";
  return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: notifData } = useListNotifications({ read: false }, { query: { refetchInterval: 30000 } });
  const unreadCount = notifData?.unreadCount || 0;

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const roleBadge = ROLE_BADGE_COLORS[user.role] || "bg-gray-100 text-gray-700";
  const notifPath = getNotifPath(user.role);

  const SidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-white">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <BloodLinkLogo className="w-8 h-8" />
          <span className="text-xl font-bold text-white">BloodLink</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.href} {...item} />)}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</div>
            <div className={cn("text-xs px-1.5 py-0.5 rounded-full mt-0.5 inline-block font-medium", roleBadge)}>
              {ROLE_LABELS[user.role]}
            </div>
            {user.role === "donor" && user.bloodType && (
              <div className="mt-1"><BloodTypeBadge bloodType={user.bloodType} size="sm" /></div>
            )}
            {(user.role === "hospital" || user.role === "clinic") && user.organizationName && (
              <div className="text-xs text-white/50 truncate mt-0.5">{user.organizationName}</div>
            )}
            {(user.role === "transfusion_center" || user.role === "blood_bank") && user.region && (
              <div className="text-xs text-white/50 truncate mt-0.5">{user.region}</div>
            )}
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 shrink-0 flex-col">
        {SidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex flex-col">{SidebarContent}</div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2">
              <BloodLinkLogo className="w-6 h-6" />
              <span className="font-semibold text-foreground">BloodLink</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifPath && (
              <Link href={notifPath} className="relative p-2 hover:bg-accent rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="font-medium text-foreground text-sm leading-none">{user.firstName} {user.lastName}</span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full mt-0.5 font-medium", roleBadge)}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
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
