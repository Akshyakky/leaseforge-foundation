
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import module components
import CurrencyList from "@/pages/currencyMaster/CurrencyList";
import CurrencyForm from "@/pages/currencyMaster/CurrencyForm";
import CurrencyDetails from "@/pages/currencyMaster/CurrencyDetails";

const currencyRoutes = (
  <>
    <Route
      path="currencies"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CurrencyList />
        </ProtectedRoute>
      }
    />
    <Route
      path="currencies/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <CurrencyForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="currencies/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <CurrencyForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="currencies/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CurrencyDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default currencyRoutes;
