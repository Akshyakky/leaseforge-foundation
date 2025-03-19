import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoadingPage from "@/components/common/LoadingPage";
import MainLayout from "@/components/layout/MainLayout";

// Import route modules
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import roleRoutes from "./roleRoutes";
import departmentRoutes from "./departmentRoutes";
import dashboardRoutes from "./dashboardRoutes";
import settingsRoutes from "./settingsRoutes";
import ProtectedRoute from "./ProtectedRoute";
import companyRoutes from "./companyRoutes";
import costCenterRoutes from "./costCenterRoutes";

// Main routes component
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        {/* Public auth routes */}
        {authRoutes}

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

          {/* Dashboard routes */}
          {dashboardRoutes}

          {/* User routes */}
          {userRoutes}

          {/* Role routes */}
          {roleRoutes}

          {/* Department routes */}
          {departmentRoutes}

          {/* Company routes */}
          {companyRoutes}

          {/* Cost Center routes */}
          {costCenterRoutes}

          {/* Settings routes */}
          {settingsRoutes}
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
