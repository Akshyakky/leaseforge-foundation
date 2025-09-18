// src/components/common/CompanySelector.tsx
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { switchCompany } from "@/features/auth/authSlice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CompanySelector = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [switching, setSwitching] = useState(false);

  if (!user || !user.companies || user.companies.length <= 1) {
    return null;
  }

  const handleCompanyChange = async (companyId: string) => {
    setSwitching(true);
    try {
      await dispatch(switchCompany(companyId)).unwrap();
      toast.success("Company switched successfully");
    } catch (error) {
      toast.error("Failed to switch company");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Building className="h-4 w-4 text-muted-foreground" />
      <Select value={user.currentCompanyId} onValueChange={handleCompanyChange} disabled={switching}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent>
          {user.companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
              {company.isDefault && " (Default)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {switching && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
};

export default CompanySelector;
