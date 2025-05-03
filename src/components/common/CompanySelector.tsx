// src/components/common/CompanySelector.tsx
import React from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { switchCompany } from "@/features/auth/authSlice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building } from "lucide-react";

const CompanySelector = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  if (!user || !user.companies || user.companies.length <= 1) {
    return null; // Don't show selector if user has 0 or 1 company
  }

  const handleCompanyChange = (companyId: string) => {
    dispatch(switchCompany(companyId));
  };

  return (
    <div className="flex items-center gap-2">
      <Building className="h-4 w-4 text-muted-foreground" />
      <Select value={user.currentCompanyId} onValueChange={handleCompanyChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent>
          {user.companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompanySelector;
