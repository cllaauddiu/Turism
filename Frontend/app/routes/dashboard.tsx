import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import ClientDashboard from "~/routes/client-dashboard";
import AdminDashboard from "~/routes/admin-dashboard";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate("/auth");
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  if (user.role === "CLIENT") return <ClientDashboard />;
  if (user.role === "ADMIN")  return <AdminDashboard />;

  return null;
}

