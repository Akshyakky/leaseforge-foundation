import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Import department module components
import Departments from "@/pages/department/Departments";
import DepartmentForm from "@/pages/department/DepartmentForm";
import DepartmentUsers from "@/pages/department/DepartmentUsers";
import DepartmentStatistics from "@/pages/department/DepartmentStatistics";

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
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <DepartmentForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="departments/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
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
