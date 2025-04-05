
import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/lib/store";
import LoadingPage from "@/components/common/LoadingPage";
import { setupTokenRefresh } from "@/features/auth/authService";

// Import routes
import AppRoutes from "./routes";

// Import i18n
import "@/i18n/i18n";

// Create a client with better settings for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replacing cacheTime which is now gcTime)
    },
  },
});

// Root App component
const App = () => {
  useEffect(() => {
    // Set up token refresh mechanism
    const cleanup = store.dispatch(setupTokenRefresh());
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PersistGate loading={<LoadingPage />} persistor={persistor}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  );
};

export default App;
