// src/pages/UnitMaster/Settings/UnitTypeSettings.tsx
import { UnitType } from "../../../services/unitRelatedService";
import { BaseSettingsComponent } from "./BaseSettingsComponent";
import * as z from "zod";

// Define the form schema
const unitTypeSchema = z.object({
  UnitTypeName: z.string().min(1, "Unit type name is required"),
  UnitTypeCode: z.string().min(1, "Unit type code is required"),
  Description: z.string().optional(),
});

// Define the table columns
const tableColumns = [
  { key: "UnitTypeName", header: "Name" },
  { key: "UnitTypeCode", header: "Code" },
  { key: "Description", header: "Description" },
  { key: "CreatedBy", header: "Created By" },
  { key: "CreatedOn", header: "Created On" },
];

// Default values for the form
const defaultValues = {
  UnitTypeName: "",
  UnitTypeCode: "",
  Description: "",
};

export const UnitTypeSettings = () => {
  return (
    <BaseSettingsComponent<UnitType>
      entityType="UnitType"
      entityName="Unit Type"
      schema={unitTypeSchema}
      tableColumns={tableColumns}
      defaultValues={defaultValues}
      idKey="UnitTypeID"
      nameKey="UnitTypeName"
      codeKey="UnitTypeCode"
    />
  );
};
