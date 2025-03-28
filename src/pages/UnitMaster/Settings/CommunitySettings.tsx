// src/pages/UnitMaster/Settings/CommunitySettings.tsx
import { Community } from "../../../services/unitRelatedService";
import { BaseSettingsComponent } from "./BaseSettingsComponent";
import * as z from "zod";

// Define the form schema
const communitySchema = z.object({
  CommunityName: z.string().min(1, "Community name is required"),
  CommunityCode: z.string().min(1, "Community code is required"),
  Description: z.string().optional(),
});

// Define the table columns
const tableColumns = [
  { key: "CommunityName", header: "Name" },
  { key: "CommunityCode", header: "Code" },
  { key: "Description", header: "Description" },
  { key: "CreatedBy", header: "Created By" },
  { key: "CreatedOn", header: "Created On" },
];

// Default values for the form
const defaultValues = {
  CommunityName: "",
  CommunityCode: "",
  Description: "",
};

// Create a type-specific component to avoid JSX generic syntax issues
const CommunitySettingsComponent = BaseSettingsComponent<Community>;

export const CommunitySettings = () => {
  return (
    <CommunitySettingsComponent
      entityType="Community"
      entityName="Community"
      schema={communitySchema}
      tableColumns={tableColumns}
      defaultValues={defaultValues}
      idKey="CommunityID"
      nameKey="CommunityName"
      codeKey="CommunityCode"
    />
  );
};
