// src/utils/currencyIcons.tsx
import React from "react";
import { DollarSign, Euro, PoundSterling, CircleDollarSign, Banknote, Coins, CreditCard, Wallet } from "lucide-react";

export interface CurrencyIconProps {
  className?: string;
  size?: string | number;
}

// Currency icon mapping
export const currencyIconMap: Record<string, React.ComponentType<CurrencyIconProps>> = {
  // US Dollar
  USD: DollarSign,
  US$: DollarSign,

  // Euro
  EUR: Euro,
  "€": Euro,

  // British Pound
  GBP: PoundSterling,
  "£": PoundSterling,

  // UAE Dirham - using CircleDollarSign as a distinct alternative
  AED: CircleDollarSign,
  "د.إ": CircleDollarSign,

  // Saudi Riyal
  SAR: Banknote,
  "ر.س": Banknote,

  // Indian Rupee
  INR: Coins,
  "₹": Coins,

  // Japanese Yen
  JPY: CreditCard,
  "¥": CreditCard,

  // Canadian Dollar
  CAD: DollarSign,
  C$: DollarSign,

  // Australian Dollar
  AUD: DollarSign,
  A$: DollarSign,

  // Swiss Franc
  CHF: Wallet,

  // Chinese Yuan
  CNY: Banknote,
  元: Banknote,

  // Default fallback
  DEFAULT: DollarSign,
};

// Get currency icon component
export const getCurrencyIcon = (currencyCode?: string): React.ComponentType<CurrencyIconProps> => {
  if (!currencyCode) return currencyIconMap.DEFAULT;

  const normalizedCode = currencyCode.toUpperCase();
  return currencyIconMap[normalizedCode] || currencyIconMap.DEFAULT;
};

// Currency icon component with props
export const CurrencyIcon: React.FC<{
  currencyCode?: string;
  className?: string;
  size?: number;
}> = ({ currencyCode, className = "h-4 w-4", size }) => {
  const IconComponent = getCurrencyIcon(currencyCode);

  const iconProps: CurrencyIconProps = {
    className,
    ...(size && { size }),
  };

  return <IconComponent {...iconProps} />;
};
