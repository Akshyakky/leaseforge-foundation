import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";

// Import cost center module components
import CostCentersList from "@/pages/costCenter/CostCentersList";
import CostCenterForm from "@/pages/costCenter/CostCenterForm";
import CostCenterHierarchyView from "@/pages/costCenter/CostCenterHierarchyView";

const costCenterRoutes = (
  <>
    <Route
      path="cost-centers"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CostCentersList />
        </ProtectedRoute>
      }
    />
    <Route
      path="cost-centers/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CostCenterForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="cost-centers/edit/:level/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CostCenterForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="cost-centers/hierarchy"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CostCenterHierarchyView />
        </ProtectedRoute>
      }
    />
  </>
);

export default costCenterRoutes;
