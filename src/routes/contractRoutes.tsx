// src/routes/contractRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import module components
import ContractList from "@/pages/contract/ContractList";
import ContractForm from "@/pages/contract/ContractForm";
import ContractDetails from "@/pages/contract/ContractDetails";

const contractRoutes = (
  <>
    <Route
      path="contracts"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <ContractList />
        </ProtectedRoute>
      }
    />
    <Route
      path="contracts/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <ContractForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="contracts/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <ContractForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="contracts/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <ContractDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default contractRoutes;
