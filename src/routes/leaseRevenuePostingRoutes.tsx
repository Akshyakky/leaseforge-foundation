// src/routes/leaseRevenuePostingRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import lease revenue posting module components
import LeaseRevenuePostingList from "@/pages/leaseRevenuePosting/LeaseRevenuePostingList";
import LeaseRevenueList from "@/pages/lease-revenue/LeaseRevenueList";
import LeaseRevenueForm from "@/pages/lease-revenue/LeaseRevenueForm";
import LeaseRevenueDetails from "@/pages/lease-revenue/LeaseRevenueDetails";
import LeaseRevenuePostingForm from "@/pages/leaseRevenuePosting/LeaseRevenuePostingForm";
import LeaseRevenuePostingDetails from "@/pages/leaseRevenuePosting/LeaseRevenuePostingDetails";

const leaseRevenuePostingRoutes = (
  <>
    {/* Lease Revenue Posting Main List - View unposted and posted transactions */}
    <Route
      path="lease-revenue-posting"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseRevenueList />
        </ProtectedRoute>
      }
    />

    <Route
      path="lease-revenue/posting"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseRevenueForm />
        </ProtectedRoute>
      }
    />

    <Route
      path="lease-revenue/details/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseRevenueDetails />
        </ProtectedRoute>
      }
    />

    {/* Posting Form - Bulk posting of selected transactions */}
    {/* <Route
      path="lease-revenue-posting/post"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <LeaseRevenueForm />
        </ProtectedRoute>
      }
    /> */}

    {/* Transaction Details - View individual transaction details (unposted) */}
    {/* <Route
      path="lease-revenue-posting/details/:type/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseRevenuePostingDetails />
        </ProtectedRoute>
      }
    /> */}

    {/* Posting Details - View posted transaction details with journal entries */}
    {/* <Route
      path="lease-revenue-posting/posting-details/:postingId"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseRevenuePostingDetails />
        </ProtectedRoute>
      }
    /> */}
  </>
);

export default leaseRevenuePostingRoutes;
