// src/routes/leaseRevenuePostingRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Lazy load components
const LeaseRevenueList = React.lazy(() => import("@/pages/lease-revenue/LeaseRevenueList"));
const LeaseRevenueForm = React.lazy(() => import("@/pages/lease-revenue/LeaseRevenueForm"));
const LeaseRevenueDetails = React.lazy(() => import("@/pages/lease-revenue/LeaseRevenueDetails"));

// Lease Revenue Posting routes with role-based protection
const leaseRevenuePostingRoutes = (
  <>
    {/* Main lease revenue management list */}
    <Route
      path="/lease-revenue"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseRevenueList />
        </ProtectedRoute>
      }
    />

    {/* Lease revenue posting form */}
    <Route
      path="/lease-revenue/posting"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseRevenueForm />
        </ProtectedRoute>
      }
    />

    {/* Lease revenue details for unposted entries */}
    <Route
      path="/lease-revenue/details/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseRevenueDetails />
        </ProtectedRoute>
      }
    />

    {/* Posted lease revenue entry details */}
    <Route
      path="/lease-revenue/posted/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseRevenueDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default leaseRevenuePostingRoutes;
