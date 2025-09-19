// src/hooks/useCompanyChangeHandler.ts
import { useEffect, useRef, useCallback } from "react";
import { useAppSelector } from "@/lib/hooks";
import { toast } from "sonner";

interface UseCompanyChangeHandlerOptions {
  onCompanyChange?: (newCompanyId: string, oldCompanyId: string | null) => Promise<void> | void;
  enableLogging?: boolean;
  showNotifications?: boolean;
}

export const useCompanyChangeHandler = ({ onCompanyChange, enableLogging = false, showNotifications = true }: UseCompanyChangeHandlerOptions = {}) => {
  const { user } = useAppSelector((state) => state.auth);
  const previousCompanyIdRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);

  const handleCompanyChange = useCallback(
    async (newCompanyId: string, oldCompanyId: string | null) => {
      if (enableLogging) {
        console.log("Company changed:", { from: oldCompanyId, to: newCompanyId });
      }

      if (showNotifications) {
        const companyName = user?.currentCompanyName;
        toast.info(`Switched to ${companyName}. Refreshing data...`);
      }

      if (onCompanyChange) {
        try {
          await onCompanyChange(newCompanyId, oldCompanyId);

          if (showNotifications) {
            toast.success("Data refreshed for current company");
          }
        } catch (error) {
          console.error("Error handling company change:", error);
          if (showNotifications) {
            toast.error("Failed to refresh data for new company");
          }
        }
      }
    },
    [onCompanyChange, enableLogging, showNotifications, user?.currentCompanyName]
  );

  useEffect(() => {
    const currentCompanyId = user?.currentCompanyId || null;

    // Skip on initial mount
    if (isInitialMount.current) {
      previousCompanyIdRef.current = currentCompanyId;
      isInitialMount.current = false;
      return;
    }

    // Check if company has changed
    if (currentCompanyId !== previousCompanyIdRef.current) {
      handleCompanyChange(currentCompanyId || "", previousCompanyIdRef.current);
      previousCompanyIdRef.current = currentCompanyId;
    }
  }, [user?.currentCompanyId, handleCompanyChange]);

  return {
    currentCompanyId: user?.currentCompanyId,
    currentCompanyName: user?.currentCompanyName,
  };
};
