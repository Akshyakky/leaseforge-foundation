// src/pages/UnitMaster/Settings/UnitViewSettings.tsx
import { UnitView } from "../../../services/unitRelatedService";
import { BaseSettingsComponent } from "./BaseSettingsComponent";
import * as z from "zod";

// Define the form schema
const unitViewSchema = z.object({
  UnitViewName: z.string().min(1, "Unit view name is required"),
  UnitViewCode: z.string().min(1, "Unit view code is required"),
  Description: z.string().optional(),
});

// Define the table columns
const tableColumns = [
  { key: "UnitViewName", header: "Name" },
  { key: "UnitViewCode", header: "Code" },
  { key: "Description", header: "Description" },
  { key: "CreatedBy", header: "Created By" },
  { key: "CreatedOn", header: "Created On" },
];

// Default values for the form
const defaultValues = {
  UnitViewName: "",
  UnitViewCode: "",
  Description: "",
};

// Create a type-specific component to avoid JSX generic syntax issues
const UnitViewSettingsComponent = BaseSettingsComponent<UnitView>;

export const UnitViewSettings = () => {
  return (
    <UnitViewSettingsComponent
      entityType="UnitView"
      entityName="Unit View"
      schema={unitViewSchema}
      tableColumns={tableColumns}
      defaultValues={defaultValues}
      idKey="UnitViewID"
      nameKey="UnitViewName"
      codeKey="UnitViewCode"
    />
  );
};
