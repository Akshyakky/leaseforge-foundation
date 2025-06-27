import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Import country module components
import Countries from "@/pages/country/Countries";
import CountryForm from "@/pages/country/CountryForm";
import CountryDetails from "@/pages/country/CountryDetails";

const countryRoutes = (
  <>
    <Route
      path="countries"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <Countries />
        </ProtectedRoute>
      }
    />
    <Route
      path="countries/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CountryForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="countries/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CountryForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="countries/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <CountryDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default countryRoutes;
