// src/routes/paymentVoucherRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import payment voucher module components
import PaymentVoucherList from "@/pages/paymentVoucher/PaymentVoucherList";
import PaymentVoucherForm from "@/pages/paymentVoucher/PaymentVoucherForm";
import PaymentVoucherDetails from "@/pages/paymentVoucher/PaymentVoucherDetails";

const paymentVoucherRoutes = (
  <>
    {/* Payment Voucher List - View all payment vouchers */}
    <Route
      path="payment-vouchers"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PaymentVoucherList />
        </ProtectedRoute>
      }
    />

    {/* Create New Payment Voucher */}
    <Route
      path="payment-vouchers/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <PaymentVoucherForm />
        </ProtectedRoute>
      }
    />

    {/* Edit Existing Payment Voucher */}
    <Route
      path="payment-vouchers/edit/:voucherNo"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <PaymentVoucherForm />
        </ProtectedRoute>
      }
    />

    {/* View Payment Voucher Details */}
    <Route
      path="payment-vouchers/:voucherNo"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PaymentVoucherDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default paymentVoucherRoutes;
