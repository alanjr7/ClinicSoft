import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

interface Props {
  /** Si se especifica, solo este rol puede acceder */
  allowedRole?: "superadmin" | "dentist" | "staff" | "admin";
  /** Ruta a la que redirigir si no tiene permiso */
  redirectTo?: string;
}

export function ProtectedRoute({ allowedRole, redirectTo = "/login" }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-4 border-[#0284C7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;

  // Si se requiere rol específico
  if (allowedRole) {
    const userRole = user?.global_role === "superadmin" ? "superadmin" : user?.role;
    if (userRole !== allowedRole) {
      // Superadmin va a su panel, el resto al ERP
      const fallback = user?.global_role === "superadmin" ? "/superadmin" : "/";
      return <Navigate to={fallback} replace />;
    }
  }

  return <Outlet />;
}
