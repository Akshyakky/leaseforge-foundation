
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import LoginForm from "@/components/auth/LoginForm";
import { checkAuth } from "@/features/auth/authService";

const Login = () => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Check authentication on mount
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Don't show login form while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-muted/30">
        <div className="h-8 w-8 border-4 border-primary border-r-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

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
