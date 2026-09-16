import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "@/lib/session";

export function StudentGuard() {
  const { user, loading } = useSession();
  if (loading) return null;
  if (!user || user.role !== "student") return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminGuard() {
  const { user, loading } = useSession();
  if (loading) return null;
  if (!user || user.role !== "admin") return <Navigate to="/login" replace />;
  return <Outlet />;
}
