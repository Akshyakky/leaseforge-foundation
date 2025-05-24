import React from "react";
import { Route } from "react-router-dom";
import { lazyLoad } from "@/lib/performance";

// Lazy-loaded dashboard components
const Dashboard = lazyLoad(() => import("@/pages/dashboards/Dashboard"));
const AnalyticsDashboard = lazyLoad(() => import("@/pages/dashboards/AnalyticsDashboard"));
const SalesDashboard = lazyLoad(() => import("@/pages/dashboards/SalesDashboard"));
const OperationsDashboard = lazyLoad(() => import("@/pages/dashboards/OperationsDashboard"));

const dashboardRoutes = (
  <>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="analytics-dashboard" element={<AnalyticsDashboard />} />
    <Route path="sales-dashboard" element={<SalesDashboard />} />
    <Route path="operations-dashboard" element={<OperationsDashboard />} />
  </>
);

export default dashboardRoutes;
