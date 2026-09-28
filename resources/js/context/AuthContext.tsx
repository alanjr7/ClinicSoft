import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../lib/api";
import { setTokens, clearTokens, getAccessToken } from "../lib/auth";
import type { AuthUser, AppModule } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  hasModule: (module: AppModule) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al montar, si hay token, cargar datos del usuario
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.get<AuthUser>("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const { data: tokens } = await api.post("/auth/login", { email, password });
    setTokens(tokens.access_token);
    const { data: me } = await api.get<AuthUser>("/auth/me");
    setUser(me);
    return me;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.href = "/login";
  };

  /**
   * Verifica si el usuario tiene acceso a un módulo específico.
   * - superadmin: no tiene acceso al ERP
   * - dentist / admin: acceso total (permissions vacío = todo habilitado)
   * - staff: solo los módulos en permissions[]
   */
  const hasModule = (module: AppModule): boolean => {
    if (!user) return false;
    if (user.global_role === "superadmin") return false;
    if (user.role === "dentist" || user.role === "admin") return true;
    return user.permissions.includes(module);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, hasModule }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
