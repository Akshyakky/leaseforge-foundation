
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import LanguageSettings from "@/pages/LanguageSettings";
import Dashboard from "@/pages/Dashboard";
import UIExamples from "@/pages/UIExamples";
import FormExamples from "@/pages/FormExamples";
import DataDisplayExamples from "@/pages/DataDisplayExamples";
import SampleModule from "@/pages/SampleModule";
import Settings from "@/pages/Settings";
import AnalyticsDashboard from "@/pages/dashboards/AnalyticsDashboard";
import SalesDashboard from "@/pages/dashboards/SalesDashboard";
import OperationsDashboard from "@/pages/dashboards/OperationsDashboard";
import Users from "@/pages/Users";
import UserForm from "@/pages/UserForm";
import RolesList from "@/pages/RolesList";
import RoleForm from "@/pages/RoleForm";
import RolePermissions from "@/pages/RolePermissions";
import RoleUsers from "@/pages/RoleUsers";

import "./App.css";

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="ui-examples" element={<UIExamples />} />
              <Route path="form-examples" element={<FormExamples />} />
              <Route path="data-display-examples" element={<DataDisplayExamples />} />
              <Route path="sample-module" element={<SampleModule />} />
              <Route path="language-settings" element={<LanguageSettings />} />
              <Route path="settings" element={<Settings />} />
              
              {/* Dashboards */}
              <Route path="dashboards/analytics" element={<AnalyticsDashboard />} />
              <Route path="dashboards/sales" element={<SalesDashboard />} />
              <Route path="dashboards/operations" element={<OperationsDashboard />} />
              
              {/* User Management */}
              <Route path="users" element={<Users />} />
              <Route path="users/new" element={<UserForm />} />
              <Route path="users/edit/:id" element={<UserForm />} />
              <Route path="users/view/:id" element={<UserForm />} />
              
              {/* Role Management */}
              <Route path="roles" element={<RolesList />} />
              <Route path="roles/new" element={<RoleForm />} />
              <Route path="roles/edit/:id" element={<RoleForm />} />
              <Route path="roles/:id/permissions" element={<RolePermissions />} />
              <Route path="roles/:id/users" element={<RoleUsers />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </PersistGate>
    </Provider>
  );
};

export default App;
