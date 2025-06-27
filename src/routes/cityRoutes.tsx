import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Import city module components
import Cities from "@/pages/city/Cities";
import CityForm from "@/pages/city/CityForm";
import CityDetails from "@/pages/city/CityDetails";

const cityRoutes = (
  <>
    <Route
      path="cities"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <Cities />
        </ProtectedRoute>
      }
    />
    <Route
      path="cities/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CityForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="cities/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CityForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="cities/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CityDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default cityRoutes;
