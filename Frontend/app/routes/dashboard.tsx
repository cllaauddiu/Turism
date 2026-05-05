import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import ClientDashboard from "~/routes/client-dashboard";
import AdminDashboard from "~/routes/admin-dashboard";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/auth");
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-green-400 font-mono text-sm animate-pulse">Se incarca...</div>
      </div>
    );
  }

  if (!user) return null;

  if (user.role === "CLIENT" || user.role === "GUEST") return <ClientDashboard />;
  if (user.role === "ADMIN") return <AdminDashboard />;

  return null;
}
