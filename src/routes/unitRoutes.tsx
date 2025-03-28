import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import unit master module components
import { UnitMasterPage } from "@/pages/UnitMaster";
import { UnitDashboard } from "@/pages/UnitMaster/UnitDashboard";
import { UnitStatistics } from "@/pages/UnitMaster/UnitStatistics";
import { UnitMasterSettingsPage } from "@/pages/UnitMaster/UnitMasterSettingsPage";

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
    {/* <Route
      path="units/statistics"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <UnitStatistics />
        </ProtectedRoute>
      }
    /> */}
    {/* Unit Master Settings Routes */}
    <Route
      path="units/settings"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <UnitMasterSettingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="units/settings/:settingType"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <UnitMasterSettingsPage />
        </ProtectedRoute>
      }
    />
  </>
);

export default unitRoutes;
