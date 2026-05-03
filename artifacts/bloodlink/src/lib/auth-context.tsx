import React, { createContext, useContext, useState, useEffect } from "react";

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "donor" | "transfusion_center" | "blood_bank" | "hospital" | "clinic";
  region?: string;
  organizationName?: string;
  bloodType?: string;
  gender?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("bl_token");
    const storedUser = localStorage.getItem("bl_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = (user: AuthUser, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("bl_token", token);
    localStorage.setItem("bl_user", JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("bl_token");
    localStorage.removeItem("bl_user");
  };

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getDashboardPath(role: string): string {
  switch (role) {
    case "donor": return "/donor/dashboard";
    case "transfusion_center":
    case "blood_bank": return "/center/dashboard";
    case "hospital": return "/hospital/dashboard";
    case "clinic": return "/clinic/dashboard";
    default: return "/";
  }
}
