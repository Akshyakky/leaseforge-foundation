// src/routes/terminationRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import TerminationList from "@/pages/termination/TerminationList";
import TerminationForm from "@/pages/termination/TerminatioForm";
import TerminationDetails from "@/pages/termination/TerminationDetails";

// Import module components

const terminationRoutes = (
  <>
    <Route
      path="terminations"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <TerminationList />
        </ProtectedRoute>
      }
    />
    <Route
      path="terminations/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <TerminationForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="terminations/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <TerminationForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="terminations/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <TerminationDetails />
        </ProtectedRoute>
      }
    />
    <Route
      path="contracts/:contractId/terminations/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <TerminationForm />
        </ProtectedRoute>
      }
    />
  </>
);

export default terminationRoutes;
