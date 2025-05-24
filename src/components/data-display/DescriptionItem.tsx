// src/components/data-display/DescriptionItem.tsx
import React from "react";

interface DescriptionItemProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export const DescriptionItem: React.FC<DescriptionItemProps> = ({ label, value, className }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value || "-"}</dd>
    </div>
  );
};
