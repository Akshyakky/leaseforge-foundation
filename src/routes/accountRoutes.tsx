import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import account module components
import AccountList from "@/pages/account/AccountList";
import AccountForm from "@/pages/account/AccountForm";
import AccountDetails from "@/pages/account/AccountDetails";
import AccountHierarchy from "@/pages/account/AccountHierarchy";
import AccountTypeList from "@/pages/account/AccountTypeList";
import AccountTypeForm from "@/pages/account/AccountTypeForm";
import BalanceSheet from "@/pages/account/reports/BalanceSheet";
import IncomeStatement from "@/pages/account/reports/IncomeStatement";
import TrialBalance from "@/pages/account/reports/TrialBalance";

const accountRoutes = (
  <>
    {/* Account Routes */}
    <Route
      path="accounts"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <AccountList />
        </ProtectedRoute>
      }
    />
    <Route
      path="accounts/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <AccountForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="accounts/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <AccountForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="accounts/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <AccountDetails />
        </ProtectedRoute>
      }
    />
    <Route
      path="accounts/hierarchy"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <AccountHierarchy />
        </ProtectedRoute>
      }
    />

    {/* Account Type Routes */}
    <Route
      path="account-types"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <AccountTypeList />
        </ProtectedRoute>
      }
    />
    <Route
      path="account-types/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <AccountTypeForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="account-types/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <AccountTypeForm />
        </ProtectedRoute>
      }
    />

    {/* Financial Reports Routes */}
    <Route
      path="financial-reports/balance-sheet"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <BalanceSheet />
        </ProtectedRoute>
      }
    />
    <Route
      path="financial-reports/income-statement"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <IncomeStatement />
        </ProtectedRoute>
      }
    />
    <Route
      path="financial-reports/trial-balance"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <TrialBalance />
        </ProtectedRoute>
      }
    />
  </>
);

export default accountRoutes;
