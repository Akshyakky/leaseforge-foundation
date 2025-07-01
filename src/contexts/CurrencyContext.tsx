// src/contexts/CurrencyContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { currencyService, Currency } from "@/services/currencyService";
import { getCurrencyIcon } from "@/utils/currencyIcons";

interface CurrencyContextType {
  defaultCurrency: Currency | null;
  isLoading: boolean;
  error: string | null;
  refreshDefaultCurrency: () => Promise<void>;
  getCurrencyIcon: (currencyCode?: string) => React.ComponentType<any>;
  formatCurrency: (amount: number, currencyCode?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDefaultCurrency = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const currency = await currencyService.getDefaultCurrency();
      setDefaultCurrency(currency);
    } catch (err) {
      console.error("Error fetching default currency:", err);
      setError("Failed to load default currency");

      // Fallback to USD if no default currency is found
      setDefaultCurrency({
        CurrencyID: 0,
        CurrencyCode: "USD",
        CurrencyName: "US Dollar",
        ConversionRate: 1,
        IsDefault: true,
      } as Currency);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDefaultCurrency = async () => {
    await fetchDefaultCurrency();
  };

  const getContextCurrencyIcon = (currencyCode?: string) => {
    // Use provided currency code or fall back to default currency
    const codeToUse = currencyCode || defaultCurrency?.CurrencyCode;
    return getCurrencyIcon(codeToUse);
  };

  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const codeToUse = currencyCode || defaultCurrency?.CurrencyCode || "USD";

    // Custom formatting for specific currencies
    const formatters: Record<string, (amount: number) => string> = {
      AED: (amount) => `د.إ ${amount.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      SAR: (amount) => `ر.س ${amount.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      EUR: (amount) => `€${amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      GBP: (amount) => `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      INR: (amount) => `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      JPY: (amount) => `¥${amount.toLocaleString("ja-JP", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    };

    const formatter = formatters[codeToUse.toUpperCase()];
    if (formatter) {
      return formatter(amount);
    }

    // Default formatting for USD and other currencies
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: codeToUse,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    fetchDefaultCurrency();
  }, []);

  const value: CurrencyContextType = {
    defaultCurrency,
    isLoading,
    error,
    refreshDefaultCurrency,
    getCurrencyIcon: getContextCurrencyIcon,
    formatCurrency,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

// Hook for getting currency icon specifically
export const useCurrencyIcon = (currencyCode?: string) => {
  const { getCurrencyIcon } = useCurrency();
  return getCurrencyIcon(currencyCode);
};
