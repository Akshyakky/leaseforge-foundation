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

export const DirhamCircleIcon: React.FC<CurrencyIconProps> = ({ className = "h-4 w-4", size }) => {
  const sizeValue = size || 24;

  return (
    <svg width={sizeValue} height={sizeValue} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />

      {/* Dirham symbol - D with two horizontal lines */}
      <g transform="translate(12, 12)">
        {/* Letter D shape */}
        <path
          d="M -3 -5 L -3 5 L 1 5 Q 3.5 5 3.5 2.5 L 3.5 -2.5 Q 3.5 -5 1 -5 Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Upper horizontal line */}
        <line x1="-4" y1="-2" x2="3" y2="-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

        {/* Lower horizontal line */}
        <line x1="-4" y1="1" x2="3" y2="1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// Update the mapping to use custom AED icon
currencyIconMap["AED"] = DirhamCircleIcon;
