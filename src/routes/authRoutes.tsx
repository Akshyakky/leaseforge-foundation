import React from "react";
import { Route } from "react-router-dom";
import { lazyLoad } from "@/lib/performance";

// Lazy-loaded auth pages
const Login = lazyLoad(() => import("@/pages/auth/Login"));
const NotFound = lazyLoad(() => import("@/pages/auth/NotFound"));
const Unauthorized = lazyLoad(() => import("@/pages/auth/Unauthorized"));

const authRoutes = (
  <>
    <Route path="/login" element={<Login />} />
    <Route path="/not-found" element={<NotFound />} />
    <Route path="/unauthorized" element={<Unauthorized />} />
  </>
);

export default authRoutes;
