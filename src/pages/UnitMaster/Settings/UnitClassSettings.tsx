// src/pages/UnitMaster/Settings/UnitClassSettings.tsx
import { UnitClass } from "../../../services/unitRelatedService";
import { BaseSettingsComponent } from "./BaseSettingsComponent";
import * as z from "zod";

// Define the form schema
const unitClassSchema = z.object({
  UnitClassName: z.string().min(1, "Unit class name is required"),
  UnitClassCode: z.string().min(1, "Unit class code is required"),
  Description: z.string().optional(),
});

// Define the table columns
const tableColumns = [
  { key: "UnitClassName", header: "Name" },
  { key: "UnitClassCode", header: "Code" },
  { key: "Description", header: "Description" },
  { key: "CreatedBy", header: "Created By" },
  { key: "CreatedOn", header: "Created On" },
];

// Default values for the form
const defaultValues = {
  UnitClassName: "",
  UnitClassCode: "",
  Description: "",
};

// Create a type-specific component to avoid JSX generic syntax issues
const UnitClassSettingsComponent = BaseSettingsComponent<UnitClass>;

export const UnitClassSettings = () => {
  return (
    <UnitClassSettingsComponent
      entityType="UnitClass"
      entityName="Unit Class"
      schema={unitClassSchema}
      tableColumns={tableColumns}
      defaultValues={defaultValues}
      idKey="UnitClassID"
      nameKey="UnitClassName"
      codeKey="UnitClassCode"
    />
  );
};
