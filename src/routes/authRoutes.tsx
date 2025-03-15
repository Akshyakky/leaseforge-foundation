import React from "react";
import { Route } from "react-router-dom";
import { lazyLoad } from "@/lib/performance";

// Lazy-loaded auth pages
const Login = lazyLoad(() => import("@/pages/Login"));
const NotFound = lazyLoad(() => import("@/pages/NotFound"));
const Unauthorized = lazyLoad(() => import("@/pages/Unauthorized"));

const authRoutes = (
  <>
    <Route path="/login" element={<Login />} />
    <Route path="/not-found" element={<NotFound />} />
    <Route path="/unauthorized" element={<Unauthorized />} />
  </>
);

export default authRoutes;
