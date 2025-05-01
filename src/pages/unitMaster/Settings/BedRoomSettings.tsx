import { BedRoom } from "../../../services/unitRelatedService";
import { BaseSettingsComponent } from "./BaseSettingsComponent";
import * as z from "zod";

// Define the form schema
const bedRoomSchema = z.object({
  BedRoomCount: z.coerce.number().min(0, "Bedroom count must be non-negative"),
  Description: z.string().optional(),
});

// Define the table columns
const tableColumns = [
  { key: "BedRoomCount", header: "Number of Bedrooms" },
  { key: "Description", header: "Description" },
  { key: "CreatedBy", header: "Created By" },
  { key: "CreatedOn", header: "Created On" },
];

// Default values for the form
const defaultValues = {
  BedRoomCount: 0,
  Description: "",
};

// Create a type-specific component to avoid JSX generic syntax issues
const BedRoomSettingsComponent = BaseSettingsComponent<BedRoom>;

export const BedRoomSettings = () => {
  const renderAdditionalFields = (form: any) => (
    <div>
      <label className="text-sm font-medium">Number of Bedrooms</label>
      <input
        type="number"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        {...form.register("BedRoomCount", { valueAsNumber: true })}
      />
      {form.formState.errors.BedRoomCount && <p className="text-sm font-medium text-destructive">{form.formState.errors.BedRoomCount.message}</p>}
    </div>
  );

  const formatEntityForSubmit = (data: any) => {
    return {
      BedRoomCount: data.BedRoomCount,
      Description: data.Description,
    };
  };

  return (
    <BedRoomSettingsComponent
      entityType="BedRoom"
      entityName="Bedroom Configuration"
      schema={bedRoomSchema}
      tableColumns={tableColumns}
      defaultValues={defaultValues}
      idKey="BedRoomID"
      nameKey="BedRoomCount"
      renderAdditionalFields={renderAdditionalFields}
      formatEntityForSubmit={formatEntityForSubmit}
    />
  );
};
