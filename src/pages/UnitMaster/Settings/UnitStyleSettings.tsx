// src/pages/UnitMaster/Settings/UnitStyleSettings.tsx
import { UnitStyle } from "../../../services/unitRelatedService";
import { BaseSettingsComponent } from "./BaseSettingsComponent";
import * as z from "zod";

// Define the form schema
const unitStyleSchema = z.object({
  UnitStyleName: z.string().min(1, "Unit style name is required"),
  UnitStyleCode: z.string().min(1, "Unit style code is required"),
  Description: z.string().optional(),
});

// Define the table columns
const tableColumns = [
  { key: "UnitStyleName", header: "Name" },
  { key: "UnitStyleCode", header: "Code" },
  { key: "Description", header: "Description" },
  { key: "CreatedBy", header: "Created By" },
  { key: "CreatedOn", header: "Created On" },
];

// Default values for the form
const defaultValues = {
  UnitStyleName: "",
  UnitStyleCode: "",
  Description: "",
};

// Create a type-specific component to avoid JSX generic syntax issues
const UnitStyleSettingsComponent = BaseSettingsComponent<UnitStyle>;

export const UnitStyleSettings = () => {
  return (
    <UnitStyleSettingsComponent
      entityType="UnitStyle"
      entityName="Unit Style"
      schema={unitStyleSchema}
      tableColumns={tableColumns}
      defaultValues={defaultValues}
      idKey="UnitStyleID"
      nameKey="UnitStyleName"
      codeKey="UnitStyleCode"
    />
  );
};
