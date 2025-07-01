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

// Import routes
import AppRoutes from "./routes";

// Import i18n
import "@/i18n/i18n";
import { CurrencyProvider } from "./contexts/CurrencyContext";

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
const App = () => (
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <CurrencyProvider>
        <PersistGate loading={<LoadingPage />} persistor={persistor}>
          <TooltipProvider>
            <div className="h-screen flex flex-col overflow-hidden">
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </div>
          </TooltipProvider>
        </PersistGate>
      </CurrencyProvider>
    </Provider>
  </QueryClientProvider>
);

export default App;
