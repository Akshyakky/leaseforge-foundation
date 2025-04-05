
import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setSidebarState } from "@/features/ui/uiSlice";
import { checkAuth } from "@/features/auth/authService";
import DynamicSidebar from "./DynamicSidebar";
import Navbar from "./Navbar";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { useIsMobile } from "@/hooks/use-mobile";
import useLanguageSync from "@/hooks/use-language-sync";
import { authService } from "@/services/authService";

const MainLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { sidebarOpen } = useAppSelector((state) => state.ui);

  // Sync language between i18n and Redux
  useLanguageSync();

  // Check auth status whenever location changes
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch, location]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Toggle sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      dispatch(setSidebarState(false));
    } else {
      dispatch(setSidebarState(true));
    }
  }, [isMobile, dispatch]);

  if (isLoading) {
    return null; // Can replace with a loading spinner if needed
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <DynamicSidebar isOpen={sidebarOpen} />

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "ml-64" : "ml-16"}`}>
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <Breadcrumbs />
            <div className="animate-fade-in py-4">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
