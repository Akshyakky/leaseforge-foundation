
import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setSidebarState } from "@/features/ui/uiSlice";
import { checkAuth } from "@/features/auth/authService";
import DynamicSidebar from "./DynamicSidebar";
import Navbar from "./Navbar";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { useIsMobile } from "@/hooks/use-mobile";
import useLanguageSync from "@/hooks/use-language-sync";
import LoadingPage from "@/components/common/LoadingPage";

const MainLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);
  const { sidebarOpen } = useAppSelector((state) => state.ui);

  // Sync language between i18n and Redux
  useLanguageSync();

  // Check authentication on mount
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Control sidebar state based on screen size
  useEffect(() => {
    if (isMobile) {
      dispatch(setSidebarState(false));
    } else {
      dispatch(setSidebarState(true));
    }
  }, [isMobile, dispatch]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <DynamicSidebar isOpen={sidebarOpen} />

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "ml-64" : "ml-16"}`}>
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 md:px-6">
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
