import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Import department module components
import Departments from "@/pages/Departments";
import DepartmentForm from "@/pages/DepartmentForm";
import DepartmentUsers from "@/pages/DepartmentUsers";
import DepartmentStatistics from "@/pages/DepartmentStatistics";

const departmentRoutes = (
  <>
    <Route
      path="departments"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <Departments />
        </ProtectedRoute>
      }
    />
    <Route
      path="departments/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <DepartmentForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="departments/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <DepartmentForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="departments/:id/users"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <DepartmentUsers />
        </ProtectedRoute>
      }
    />
    <Route
      path="departments/:id/statistics"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <DepartmentStatistics />
        </ProtectedRoute>
      }
    />
  </>
);

export default departmentRoutes;
