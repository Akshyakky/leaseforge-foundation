// src/routes/index.tsx
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoadingPage from "@/components/common/LoadingPage";
import MainLayout from "@/components/layout/MainLayout";

// Import route modules
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import roleRoutes from "./roleRoutes";
import departmentRoutes from "./departmentRoutes";
import dashboardRoutes from "./dashboardRoutes";
import settingsRoutes from "./settingsRoutes";
import ProtectedRoute from "./ProtectedRoute";
import companyRoutes from "./companyRoutes";
import costCenterRoutes from "./costCenterRoutes";
import customerRoutes from "./customerRoutes";
import unitRoutes from "./unitRoutes";
import propertyRoutes from "./propertyRoutes";
import taxRoutes from "./taxRoutes";
import additionalChargesRoutes from "./additionalChargesRoutes";
import currencyRoutes from "./currencyRoutes";
import deductionChargesRoutes from "./deductionChargesRoutes";
import contractRoutes from "./contractRoutes";
import terminationRoutes from "./terminationRoutes";
import accountRoutes from "./accountRoutes";
import supplierRoutes from "./supplierRoutes";
import invoiceRoutes from "./invoiceRoutes";
import receiptRoutes from "./receiptRoutes";
import pettyCashRoutes from "./pettyCashRoutes";
import fiscalYearRoutes from "./fiscalYearRoutes";
import generalLedgerRoutes from "./generalLedgerRoutes";
import paymentVoucherRoutes from "./paymentVoucherRoutes";
import journalVoucherRoutes from "./journalVoucherRoutes";
import bankRoutes from "./bankRoutes";
import leaseRevenuePostingRoutes from "./leaseRevenuePostingRoutes";
import emailRoutes from "./emailRoutes";
import countryRoutes from "./countryRoutes";
import cityRoutes from "./cityRoutes";
import paymentTermsRoutes from "./paymentTermsRoutes";

// Main routes component
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        {/* Public auth routes */}
        {authRoutes}

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          {/* Dashboard routes */}
          {dashboardRoutes}
          {/* User routes */}
          {userRoutes}
          {/* Role routes */}
          {roleRoutes}
          {/* Department routes */}
          {departmentRoutes}
          {/* Customer routes */}
          {customerRoutes}
          {/* Company routes */}
          {companyRoutes}
          {/* Cost Center routes */}
          {costCenterRoutes}
          {/* Unit routes */}
          {unitRoutes}
          {/* Property routes */}
          {propertyRoutes}
          {/* Tax routes */}
          {taxRoutes}
          {/* Additional Charges routes */}
          {additionalChargesRoutes}
          {/* Currency routes */}
          {currencyRoutes}
          {/* Country Management routes */}
          {countryRoutes}
          {/* City Management routes */}
          {cityRoutes}
          {/* Settings routes */}
          {settingsRoutes}
          {/* Deduction Charges routes */}
          {deductionChargesRoutes}
          {/* Email Setup routes */}
          {emailRoutes}
          {/* Contract Management routes */}
          {contractRoutes}
          {/* Termination Management routes */}
          {terminationRoutes}
          {/* Account Management routes */}
          {accountRoutes}
          {/* Supplier Management routes */}
          {supplierRoutes}
          {/* Invoice Management routes */}
          {invoiceRoutes}
          {/* Receipt Management routes */}
          {receiptRoutes}
          {/* Petty Cash Management routes */}
          {pettyCashRoutes}
          {/* Payment Voucher Management routes */}
          {paymentVoucherRoutes}
          {/* Journal Voucher Management routes */}
          {journalVoucherRoutes}
          {/* Fiscal Year Management routes */}
          {fiscalYearRoutes}
          {/* General Ledger routes */}
          {generalLedgerRoutes}
          {/* Bank routes */}
          {bankRoutes}
          {/* Lease Revenue Posting routes */}
          {leaseRevenuePostingRoutes}
          {/* Payment Terms routes */}
          {paymentTermsRoutes}
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
