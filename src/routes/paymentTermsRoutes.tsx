import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Import payment terms module components
import PaymentTerms from "@/pages/paymentTerms/PaymentTerms";
import PaymentTermsForm from "@/pages/paymentTerms/PaymentTermsForm";
import PaymentTermsDetails from "@/pages/paymentTerms/PaymentTermsDetails";

const paymentTermsRoutes = (
  <>
    <Route
      path="payment-terms"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PaymentTerms />
        </ProtectedRoute>
      }
    />
    <Route
      path="payment-terms/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PaymentTermsForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="payment-terms/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PaymentTermsForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="payment-terms/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PaymentTermsDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default paymentTermsRoutes;
