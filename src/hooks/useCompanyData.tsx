//  src/hooks/useCompanyData.ts

import { useEffect, useCallback } from "react";
import { useAppSelector } from "@/lib/hooks";
import { toast } from "sonner";

interface UseCompanyDataOptions {
  onCompanyChange?: (companyId: string, companyName: string) => void;
  autoRefresh?: boolean;
  showToast?: boolean;
}

export const useCompanyData = (options: UseCompanyDataOptions = {}) => {
  const { onCompanyChange, autoRefresh = true, showToast = true } = options;
  const { user } = useAppSelector((state) => state.auth);

  const currentCompanyId = user?.currentCompanyId;
  const currentCompanyName = user?.currentCompanyName;

  const handleCompanyChange = useCallback(() => {
    if (currentCompanyId && currentCompanyName) {
      onCompanyChange?.(currentCompanyId, currentCompanyName);

      if (showToast) {
        toast.success(`Switched to ${currentCompanyName}`);
      }
    }
  }, [currentCompanyId, currentCompanyName, onCompanyChange]);

  useEffect(() => {
    if (autoRefresh && currentCompanyId) {
      handleCompanyChange();
    }
  }, [currentCompanyId, autoRefresh, handleCompanyChange]);

  return {
    currentCompanyId,
    currentCompanyName,
    hasCompany: Boolean(currentCompanyId),
    isMultiCompany: (user?.companies?.length || 0) > 1,
  };
};
