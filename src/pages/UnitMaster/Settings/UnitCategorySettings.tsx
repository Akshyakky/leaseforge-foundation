// src/pages/UnitMaster/Settings/UnitCategorySettings.tsx
import { UnitCategory } from "../../../services/unitRelatedService";
import { BaseSettingsComponent } from "./BaseSettingsComponent";
import * as z from "zod";

// Define the form schema
const unitCategorySchema = z.object({
  UnitCategoryName: z.string().min(1, "Unit category name is required"),
  UnitCategoryCode: z.string().min(1, "Unit category code is required"),
  Description: z.string().optional(),
});

// Define the table columns
const tableColumns = [
  { key: "UnitCategoryName", header: "Name" },
  { key: "UnitCategoryCode", header: "Code" },
  { key: "Description", header: "Description" },
  { key: "CreatedBy", header: "Created By" },
  { key: "CreatedOn", header: "Created On" },
];

// Default values for the form
const defaultValues = {
  UnitCategoryName: "",
  UnitCategoryCode: "",
  Description: "",
};

export const UnitCategorySettings = () => {
  return (
    <BaseSettingsComponent<UnitCategory>
      entityType="UnitCategory"
      entityName="Unit Category"
      schema={unitCategorySchema}
      tableColumns={tableColumns}
      defaultValues={defaultValues}
      idKey="UnitCategoryID"
      nameKey="UnitCategoryName"
      codeKey="UnitCategoryCode"
    />
  );
};
