// src/routes/contractRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import module components
import ContractList from "@/pages/contract/ContractList";
import ContractForm from "@/pages/contract/ContractForm";
import ContractDetails from "@/pages/contract/ContractDetails";
import LeaseContractList from "@/pages/leaseContract/LeaseContractList";
import LeaseContractForm from "@/pages/leaseContract/LeaseContractForm";
import LeaseContractDetails from "@/pages/leaseContract/LeaseContractDetails";

const contractRoutes = (
  <>
    <Route
      path="contracts"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          {/* <ContractList /> */}
          <LeaseContractList />
        </ProtectedRoute>
      }
    />
    <Route
      path="contracts/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          {/* <ContractForm /> */}
          <LeaseContractForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="contracts/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          {/* <ContractForm /> */}
          <LeaseContractForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="contracts/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          {/* <ContractDetails /> */}
          <LeaseContractDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default contractRoutes;
