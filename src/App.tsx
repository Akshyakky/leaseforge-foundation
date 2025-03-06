
import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from "@/lib/store";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { checkAuthStatus } from "@/features/auth/authService";
import LoadingPage from "@/components/common/LoadingPage";
import { lazyLoad } from "@/lib/performance";

// Import i18n
import '@/i18n/i18n';

// Layouts
import MainLayout from "@/components/layout/MainLayout";

// Lazy-loaded pages for code-splitting and performance optimization
const Login = lazyLoad(() => import("@/pages/Login"));
const Dashboard = lazyLoad(() => import("@/pages/Dashboard"));
const Users = lazyLoad(() => import("@/pages/Users"));
const Settings = lazyLoad(() => import("@/pages/Settings"));
const UIExamples = lazyLoad(() => import("@/pages/UIExamples"));
const DataDisplayExamples = lazyLoad(() => import("@/pages/DataDisplayExamples"));
const LanguageSettings = lazyLoad(() => import("@/pages/LanguageSettings"));
const FormExamples = lazyLoad(() => import("@/pages/FormExamples"));
const NotFound = lazyLoad(() => import("@/pages/NotFound"));

// Create a client with better settings for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replacing cacheTime which is now gcTime)
    },
  },
});

// Protected route component with role-based authorization
const ProtectedRoute = ({ 
  children, 
  requiredRoles = [] 
}: { 
  children: React.ReactNode, 
  requiredRoles?: string[] 
}) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector(state => state.auth);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based authorization check
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Main app component with route configuration
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="settings" element={<Settings />} />
            <Route path="language-settings" element={<LanguageSettings />} />
            <Route path="ui-examples" element={<UIExamples />} />
            <Route path="data-examples" element={<DataDisplayExamples />} />
            <Route path="form-examples" element={<FormExamples />} />
            {/* Add other routes here */}
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

// Root App component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <PersistGate loading={<LoadingPage />} persistor={persistor}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </PersistGate>
    </Provider>
  </QueryClientProvider>
);

export default App;
