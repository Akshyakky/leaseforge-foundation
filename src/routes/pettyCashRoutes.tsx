// src/routes/pettyCashRoutes.tsx
import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import Petty Cash module components
const PettyCashList = lazyLoad(() => import("@/pages/pettyCash/PettyCashList"));
//const PettyCashForm = lazyLoad(() => import("@/pages/pettyCash/PettyCashForm"));
const PettyCashDetails = lazyLoad(() => import("@/pages/pettyCash/PettyCashDetails"));

const pettyCashRoutes = (
  <>
    <Route
      path="petty-cash"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PettyCashList />
        </ProtectedRoute>
      }
    />
    {/*
    <Route
      path="petty-cash/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <PettyCashForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="petty-cash/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <PettyCashForm />
        </ProtectedRoute>
      }
    />
    */}
    <Route
      path="petty-cash/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <PettyCashDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default pettyCashRoutes;
