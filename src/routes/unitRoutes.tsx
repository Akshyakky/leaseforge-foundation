import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import unit master module components
import { UnitMasterPage } from "@/pages/UnitMaster";
import { UnitDashboard } from "@/pages/UnitMaster/UnitDashboard";
import { UnitStatistics } from "@/pages/UnitMaster/UnitStatistics";

// Lazy-loaded unit pages
// const UnitDashboard = lazyLoad(() => import("@/pages/UnitMaster/UnitDashboard"));
// const UnitStatistics = lazyLoad(() => import("@/pages/UnitMaster/UnitStatistics"));

const unitRoutes = (
  <>
    <Route
      path="units"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <UnitMasterPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="units/dashboard"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <UnitDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="units/create"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <UnitMasterPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="units/:unitId"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <UnitMasterPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="units/:unitId/edit"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <UnitMasterPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="units/statistics"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <UnitStatistics />
        </ProtectedRoute>
      }
    />
  </>
);

export default unitRoutes;
