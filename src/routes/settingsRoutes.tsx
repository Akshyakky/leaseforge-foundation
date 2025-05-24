import React from "react";
import { Route } from "react-router-dom";
import { lazyLoad } from "@/lib/performance";

// Lazy-loaded settings pages
const Settings = lazyLoad(() => import("@/pages/settings/Settings"));
const LanguageSettings = lazyLoad(() => import("@/pages/settings/LanguageSettings"));

const settingsRoutes = (
  <>
    <Route path="settings" element={<Settings />} />
    <Route path="language-settings" element={<LanguageSettings />} />
  </>
);

export default settingsRoutes;
