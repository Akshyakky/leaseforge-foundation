import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import actual components to avoid lazy-loading for frequently used pages
import Companies from "@/pages/Companies";

// Lazy-loaded company pages
const CompanyForm = lazyLoad(() => import("@/pages/CompanyForm"));
const CompanyUsers = lazyLoad(() => import("@/pages/CompanyUsers"));
const CompanyStatistics = lazyLoad(() => import("@/pages/CompanyStatistics"));

const companyRoutes = (
  <>
    <Route
      path="companies"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <Companies />
        </ProtectedRoute>
      }
    />
    <Route
      path="companies/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CompanyForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="companies/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CompanyForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="companies/:id/users"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CompanyUsers />
        </ProtectedRoute>
      }
    />
    <Route
      path="companies/:id/statistics"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CompanyStatistics />
        </ProtectedRoute>
      }
    />
  </>
);

export default companyRoutes;
