import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Import components
import RolesList from "@/pages/role/RolesList";
import RoleForm from "@/pages/role/RoleForm";
import RolePermissions from "@/pages/role/RolePermissions";
import RoleUsers from "@/pages/role/RoleUsers";

const roleRoutes = (
  <>
    <Route
      path="roles"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <RolesList />
        </ProtectedRoute>
      }
    />
    <Route
      path="roles/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <RoleForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="roles/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <RoleForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="roles/:id/permissions"
      element={
        <ProtectedRoute requiredRoles={["admin"]}>
          <RolePermissions />
        </ProtectedRoute>
      }
    />
    <Route
      path="roles/:id/users"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <RoleUsers />
        </ProtectedRoute>
      }
    />
  </>
);

export default roleRoutes;
