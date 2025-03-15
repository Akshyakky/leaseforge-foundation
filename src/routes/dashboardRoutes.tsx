import React from "react";
import { Route } from "react-router-dom";
import { lazyLoad } from "@/lib/performance";

// Lazy-loaded dashboard components
const Dashboard = lazyLoad(() => import("@/pages/Dashboard"));
const AnalyticsDashboard = lazyLoad(() => import("@/pages/dashboards/AnalyticsDashboard"));
const SalesDashboard = lazyLoad(() => import("@/pages/dashboards/SalesDashboard"));
const OperationsDashboard = lazyLoad(() => import("@/pages/dashboards/OperationsDashboard"));
const SampleModule = lazyLoad(() => import("@/pages/SampleModule"));

const dashboardRoutes = (
  <>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="analytics-dashboard" element={<AnalyticsDashboard />} />
    <Route path="sales-dashboard" element={<SalesDashboard />} />
    <Route path="operations-dashboard" element={<OperationsDashboard />} />
    <Route path="sample-module" element={<SampleModule />} />
  </>
);

export default dashboardRoutes;
