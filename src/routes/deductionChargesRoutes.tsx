// src/routes/deductionChargesRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Import module components
import DeductionChargesList from "@/pages/deductionCharges/DeductionChargesList";
import DeductionChargesForm from "@/pages/deductionCharges/DeductionChargesForm";
import DeductionChargesDetails from "@/pages/deductionCharges/DeductionChargesDetails";

const deductionChargesRoutes = (
  <>
    <Route
      path="deduction-charges"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <DeductionChargesList />
        </ProtectedRoute>
      }
    />
    <Route
      path="deduction-charges/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <DeductionChargesForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="deduction-charges/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <DeductionChargesForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="deduction-charges/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <DeductionChargesDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default deductionChargesRoutes;
