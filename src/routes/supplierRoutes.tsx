// src/routes/supplierRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import supplier module components
import SupplierList from "@/pages/supplier/SupplierList";
import SupplierForm from "@/pages/supplier/SupplierForm";
import SupplierDetails from "@/pages/supplier/SupplierDetails";

const supplierRoutes = (
  <>
    <Route
      path="suppliers"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <SupplierList />
        </ProtectedRoute>
      }
    />
    <Route
      path="suppliers/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <SupplierForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="suppliers/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <SupplierForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="suppliers/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <SupplierDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default supplierRoutes;
