// src/routes/journalVoucherRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import journal voucher module components
import JournalVoucherList from "@/pages/journalVoucher/JournalVoucherList";
import JournalVoucherForm from "@/pages/journalVoucher/JournalVoucherForm";
import JournalVoucherDetails from "@/pages/journalVoucher/JournalVoucherDetails";

const journalVoucherRoutes = (
  <>
    {/* Journal Voucher List - View all journal vouchers */}
    <Route
      path="journal-vouchers"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <JournalVoucherList />
        </ProtectedRoute>
      }
    />

    {/* Create New Journal Voucher */}
    <Route
      path="journal-vouchers/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <JournalVoucherForm />
        </ProtectedRoute>
      }
    />

    {/* Edit Existing Journal Voucher */}
    <Route
      path="journal-vouchers/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <JournalVoucherForm />
        </ProtectedRoute>
      }
    />

    {/* View Journal Voucher Details */}
    <Route
      path="journal-vouchers/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <JournalVoucherDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default journalVoucherRoutes;
