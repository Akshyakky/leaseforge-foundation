import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Lazy-loaded tax pages
const TaxListPage = lazyLoad(() => import("@/pages/taxMaster/TaxList"));
const TaxFormPage = lazyLoad(() => import("@/pages/taxMaster/TaxForm"));
const TaxDetailsPage = lazyLoad(() => import("@/pages/taxMaster/TaxDetails"));

const taxRoutes = (
  <>
    <Route
      path="taxes"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <TaxListPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="taxes/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <TaxFormPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="taxes/:taxId"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <TaxDetailsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="taxes/edit/:taxId"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <TaxFormPage />
        </ProtectedRoute>
      }
    />
  </>
);

export default taxRoutes;
