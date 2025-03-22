import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import customer module components
import Customers from "@/pages/customer/Customers";
import CustomerForm from "@/pages/customer/CustomerForm";
import CustomerDetails from "@/pages/customer/CustomerDetails";

const customerRoutes = (
  <>
    <Route
      path="customers"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <Customers />
        </ProtectedRoute>
      }
    />
    <Route
      path="customers/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CustomerForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="customers/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CustomerForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="customers/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CustomerDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default customerRoutes;
