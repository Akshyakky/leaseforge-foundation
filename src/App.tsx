import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/lib/store";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { checkAuth } from "@/features/auth/authService";
import LoadingPage from "@/components/common/LoadingPage";
import { lazyLoad } from "@/lib/performance";

// Import i18n
import "@/i18n/i18n";

// Layouts
import MainLayout from "@/components/layout/MainLayout";
import UserForm from "./pages/UserForm";
import RolesList from "./pages/RolesList";
import RoleForm from "./pages/RoleForm";
import RolePermissions from "./pages/RolePermissions";
import RoleUsers from "./pages/RoleUsers";

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

// New dashboard pages
const AnalyticsDashboard = lazyLoad(() => import("@/pages/dashboards/AnalyticsDashboard"));
const SalesDashboard = lazyLoad(() => import("@/pages/dashboards/SalesDashboard"));
const OperationsDashboard = lazyLoad(() => import("@/pages/dashboards/OperationsDashboard"));
const SampleModule = lazyLoad(() => import("@/pages/SampleModule"));

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
const ProtectedRoute = ({ children, requiredRoles = [] }: { children: React.ReactNode; requiredRoles?: string[] }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
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
            {/* New dashboard routes */}
            {/* <Route path="analytics-dashboard" element={<AnalyticsDashboard />} />
            <Route path="sales-dashboard" element={<SalesDashboard />} />
            <Route path="operations-dashboard" element={<OperationsDashboard />} />
            <Route path="sample-module" element={<SampleModule />} /> */}

            <Route
              path="users"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", , "user"]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/new"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", , "user"]}>
                  <UserForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/edit/:id"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
                  <UserForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="users/view/:id"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
                  <UserForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="roles"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
                  <RolesList />
                </ProtectedRoute>
              }
            />

            <Route
              path="roles/new"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
                  <RoleForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="roles/edit/:id"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
                  <RoleForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="roles/:id/permissions"
              element={
                <ProtectedRoute requiredRoles={["admin", "user"]}>
                  <RolePermissions />
                </ProtectedRoute>
              }
            />

            <Route
              path="roles/:id/users"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
                  <RoleUsers />
                </ProtectedRoute>
              }
            />

            <Route path="settings" element={<Settings />} />
            <Route path="language-settings" element={<LanguageSettings />} />
            {/* <Route path="ui-examples" element={<UIExamples />} />
            <Route path="data-examples" element={<DataDisplayExamples />} />
            <Route path="form-examples" element={<FormExamples />} /> */}
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
