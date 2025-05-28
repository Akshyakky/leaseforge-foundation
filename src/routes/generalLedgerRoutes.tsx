// src/routes/generalLedgerRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import General Ledger module components
import GeneralLedgerDashboard from "@/pages/generalLedger/GeneralLedgerDashboard";
import AccountLedger from "@/pages/generalLedger/AccountLedger";
import BalanceSheet from "@/pages/generalLedger/BalanceSheet";
import IncomeStatement from "@/pages/generalLedger/IncomeStatement";
import TrialBalance from "@/pages/generalLedger/TrialBalance";
import GLTransactions from "@/pages/generalLedger/GLTransactions";

// Lazy-loaded components for less frequently used pages
const ChartOfAccounts = lazyLoad(() => import("@/pages/generalLedger/ChartOfAccounts"));
const GLSummary = lazyLoad(() => import("@/pages/generalLedger/GLSummary"));
// const AgedTrialBalance = lazyLoad(() => import("@/pages/generalLedger/AgedTrialBalance"));
// const BankReconciliation = lazyLoad(() => import("@/pages/generalLedger/BankReconciliation"));
// const AccountActivity = lazyLoad(() => import("@/pages/generalLedger/AccountActivity"));

const generalLedgerRoutes = (
  <>
    {/* General Ledger Dashboard */}
    <Route
      path="general-ledger"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <GeneralLedgerDashboard />
        </ProtectedRoute>
      }
    />

    {/* Core Financial Reports */}
    <Route
      path="general-ledger/trial-balance"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <TrialBalance />
        </ProtectedRoute>
      }
    />
    <Route
      path="general-ledger/balance-sheet"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <BalanceSheet />
        </ProtectedRoute>
      }
    />
    <Route
      path="general-ledger/income-statement"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <IncomeStatement />
        </ProtectedRoute>
      }
    />

    {/* Account Management and Ledgers */}
    <Route
      path="general-ledger/account-ledger"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <AccountLedger />
        </ProtectedRoute>
      }
    />
    <Route
      path="general-ledger/chart-of-accounts"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <ChartOfAccounts />
        </ProtectedRoute>
      }
    />

    {/* Transaction Management */}
    <Route
      path="general-ledger/transactions"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <GLTransactions />
        </ProtectedRoute>
      }
    />

    {/* Analysis and Summary Reports */}
    <Route
      path="general-ledger/gl-summary"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <GLSummary />
        </ProtectedRoute>
      }
    />
    {/* <Route
      path="general-ledger/aged-trial-balance"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <AgedTrialBalance />
        </ProtectedRoute>
      }
    />
    <Route
      path="general-ledger/account-activity"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <AccountActivity />
        </ProtectedRoute>
      }
    /> */}

    {/* Bank Reconciliation */}
    {/* <Route
      path="general-ledger/bank-reconciliation"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <BankReconciliation />
        </ProtectedRoute>
      }
    /> */}
  </>
);

export default generalLedgerRoutes;
