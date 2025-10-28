// src/routes/accountingPeriodRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AccountingPeriodList from "@/pages/accountingPeriod/AccountingPeriodList";
import AccountingPeriodDetails from "@/pages/accountingPeriod/AccountingPeriodDetails";

const accountingPeriodRoutes = (
  <>
    <Route
      path="accounting-periods"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <AccountingPeriodList />
        </ProtectedRoute>
      }
    />
    <Route
      path="accounting-periods/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <AccountingPeriodDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default accountingPeriodRoutes;
