import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import actual components to avoid lazy-loading for frequently used pages
import UserForm from "@/pages/user/UserForm";

// Lazy-loaded user pages
const Users = lazyLoad(() => import("@/pages/user/Users"));

const userRoutes = (
  <>
    <Route
      path="users"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <Users />
        </ProtectedRoute>
      }
    />
    <Route
      path="users/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <UserForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="users/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <UserForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="users/view/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <UserForm />
        </ProtectedRoute>
      }
    />
  </>
);

export default userRoutes;
