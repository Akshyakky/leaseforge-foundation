import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If we know the user is authenticated, go to dashboard
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      // Otherwise, redirect to login
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  return null;
};

export default Index;
