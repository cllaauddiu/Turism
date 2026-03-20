import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  return null;
}

