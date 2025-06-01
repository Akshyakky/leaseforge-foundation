// src/routes/bankRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Import bank module components
import BankForm from "@/pages/bank/BankForm";
import BankCategoryForm from "@/pages/bank/BankCategoryForm";
import BankDetails from "@/pages/bank/BankDetails";
import BankList from "@/pages/bank/BankList";

const bankRoutes = (
  <>
    {/* Bank List - View all banks and categories */}
    <Route
      path="banks"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <BankList />
        </ProtectedRoute>
      }
    />

    {/* Create New Bank */}
    <Route
      path="banks/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <BankForm />
        </ProtectedRoute>
      }
    />

    {/* Edit Existing Bank */}
    <Route
      path="banks/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <BankForm />
        </ProtectedRoute>
      }
    />

    {/* View Bank Details */}
    <Route
      path="banks/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <BankDetails />
        </ProtectedRoute>
      }
    />

    {/* Create New Bank Category */}
    <Route
      path="bank-categories/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <BankCategoryForm />
        </ProtectedRoute>
      }
    />

    {/* Edit Existing Bank Category */}
    <Route
      path="bank-categories/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <BankCategoryForm />
        </ProtectedRoute>
      }
    />
  </>
);

export default bankRoutes;
