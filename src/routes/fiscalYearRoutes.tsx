// src/routes/fiscalYearRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import fiscal year module components
import FiscalYearList from "@/pages/fiscalYear/FiscalYearList";
import FiscalYearForm from "@/pages/fiscalYear/FiscalYearForm";
import FiscalYearDetails from "@/pages/fiscalYear/FiscalYearDetails";

const fiscalYearRoutes = (
  <>
    <Route
      path="fiscal-years"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <FiscalYearList />
        </ProtectedRoute>
      }
    />
    <Route
      path="fiscal-years/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <FiscalYearForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="fiscal-years/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <FiscalYearForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="fiscal-years/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <FiscalYearDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default fiscalYearRoutes;
