// src/routes/additionalChargesRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import module components
import AdditionalChargesList from "@/pages/additionalCharges/AdditionalChargesList";
import AdditionalChargesForm from "@/pages/additionalCharges/AdditionalChargesForm";
import AdditionalChargesDetails from "@/pages/additionalCharges/AdditionalChargesDetails";

const additionalChargesRoutes = (
  <>
    <Route
      path="additional-charges"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <AdditionalChargesList />
        </ProtectedRoute>
      }
    />
    <Route
      path="additional-charges/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <AdditionalChargesForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="additional-charges/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <AdditionalChargesForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="additional-charges/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <AdditionalChargesDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default additionalChargesRoutes;
