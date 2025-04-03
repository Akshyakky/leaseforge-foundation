import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import property module components
import PropertyList from "@/pages/property/PropertyList";
import PropertyForm from "@/pages/property/PropertyForm";
import PropertyDetails from "@/pages/property/PropertyDetails";

const propertyRoutes = (
  <>
    <Route
      path="properties"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PropertyList />
        </ProtectedRoute>
      }
    />
    <Route
      path="properties/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PropertyForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="properties/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PropertyForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="properties/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PropertyDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default propertyRoutes;
