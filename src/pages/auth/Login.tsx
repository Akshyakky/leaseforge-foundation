import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";
import LoginForm from "@/components/auth/LoginForm";

const Login = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center bg-muted/30">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xl font-semibold">MP</span>
          </div>
          <h1 className="text-3xl font-semibold">Master Project</h1>
        </div>

        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
          <LoginForm />
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Master Project - Enterprise Resource Planning System</p>
          <p>© 2023-2025 Master Project Systems</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
