import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { lazyLoad } from "@/lib/performance";

// Import email module components
import EmailSetups from "@/pages/email/EmailSetups";
import EmailSetupForm from "@/pages/email/EmailSetupForm";
import EmailTemplates from "@/pages/email/EmailTemplates";
import EmailTemplateForm from "@/pages/email/EmailTemplateForm";

// Lazy load components if needed for performance optimization
// const EmailSetups = lazyLoad(() => import("@/pages/email/EmailSetups"));
// const EmailSetupForm = lazyLoad(() => import("@/pages/email/EmailSetupForm"));
// const EmailTemplates = lazyLoad(() => import("@/pages/email/EmailTemplates"));
// const EmailTemplateForm = lazyLoad(() => import("@/pages/email/EmailTemplateForm"));

const emailRoutes = (
  <>
    {/* Email Setup Routes */}
    <Route
      path="email/setups"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <EmailSetups />
        </ProtectedRoute>
      }
    />
    <Route
      path="email/setups/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <EmailSetupForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="email/setups/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <EmailSetupForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="email/setups/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <EmailSetups />
        </ProtectedRoute>
      }
    />

    {/* Email Template Routes */}
    <Route
      path="email/templates"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <EmailTemplates />
        </ProtectedRoute>
      }
    />
    <Route
      path="email/templates/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <EmailTemplateForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="email/templates/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <EmailTemplateForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="email/templates/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <EmailTemplates />
        </ProtectedRoute>
      }
    />

    {/* Email Dashboard Route (if you have one) */}
    <Route
      path="email"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <EmailSetups />
        </ProtectedRoute>
      }
    />
  </>
);

export default emailRoutes;
