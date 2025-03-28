import { BathRoom } from "../../../services/unitRelatedService";
import { BaseSettingsComponent } from "./BaseSettingsComponent";
import * as z from "zod";

// Define the form schema
const bathRoomSchema = z.object({
  BathRoomCount: z.coerce.number().min(0, "Bathroom count must be non-negative"),
  Description: z.string().optional(),
});

// Define the table columns
const tableColumns = [
  { key: "BathRoomCount", header: "Number of Bathrooms" },
  { key: "Description", header: "Description" },
  { key: "CreatedBy", header: "Created By" },
  { key: "CreatedOn", header: "Created On" },
];

// Default values for the form
const defaultValues = {
  BathRoomCount: 0,
  Description: "",
};

export const BathRoomSettings = () => {
  const renderAdditionalFields = (form: any) => (
    <div>
      <label className="text-sm font-medium">Number of Bathrooms</label>
      <input
        type="number"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        {...form.register("BathRoomCount", { valueAsNumber: true })}
      />
      {form.formState.errors.BathRoomCount && <p className="text-sm font-medium text-destructive">{form.formState.errors.BathRoomCount.message}</p>}
    </div>
  );

  const formatEntityForSubmit = (data: any) => {
    return {
      BathRoomCount: data.BathRoomCount,
      Description: data.Description,
    };
  };

  return (
    <BaseSettingsComponent<BathRoom>
      entityType="BathRoom"
      entityName="Bathroom Configuration"
      schema={bathRoomSchema}
      tableColumns={tableColumns}
      defaultValues={defaultValues}
      idKey="BathRoomID"
      nameKey="BathRoomCount"
      renderAdditionalFields={renderAdditionalFields}
      formatEntityForSubmit={formatEntityForSubmit}
    />
  );
};
