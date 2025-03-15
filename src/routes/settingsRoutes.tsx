import React from "react";
import { Route } from "react-router-dom";
import { lazyLoad } from "@/lib/performance";

// Lazy-loaded settings pages
const Settings = lazyLoad(() => import("@/pages/Settings"));
const LanguageSettings = lazyLoad(() => import("@/pages/LanguageSettings"));
const UIExamples = lazyLoad(() => import("@/pages/UIExamples"));
const DataDisplayExamples = lazyLoad(() => import("@/pages/DataDisplayExamples"));
const FormExamples = lazyLoad(() => import("@/pages/FormExamples"));

const settingsRoutes = (
  <>
    <Route path="settings" element={<Settings />} />
    <Route path="language-settings" element={<LanguageSettings />} />
    <Route path="ui-examples" element={<UIExamples />} />
    <Route path="data-examples" element={<DataDisplayExamples />} />
    <Route path="form-examples" element={<FormExamples />} />
  </>
);

export default settingsRoutes;
