
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/lib/hooks';
import LoginForm from '@/components/auth/LoginForm';

const Login = () => {
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center bg-muted/30">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xl font-semibold">LE</span>
          </div>
          <h1 className="text-3xl font-semibold">Lease ERP</h1>
        </div>
        
        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
          <LoginForm />
        </div>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Demo credentials:</p>
          <p>Email: admin@example.com | Password: admin123</p>
          <p>Email: manager@example.com | Password: manager123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
