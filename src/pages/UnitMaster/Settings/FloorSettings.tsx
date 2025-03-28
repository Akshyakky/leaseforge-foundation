// src/pages/UnitMaster/Settings/FloorSettings.tsx
import { useState, useEffect } from "react";
import { Floor } from "../../../services/unitRelatedService";
import { BaseSettingsComponent } from "./BaseSettingsComponent";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as z from "zod";

interface FloorSettingsProps {
  properties: { PropertyID: number; PropertyName: string }[];
  isLoadingProperties: boolean;
}

// Define the form schema
const floorSchema = z.object({
  FloorName: z.string().min(1, "Floor name is required"),
  FloorNumber: z.coerce.number().min(0, "Floor number must be non-negative"),
  PropertyID: z.coerce.number().min(1, "Property is required"),
  Description: z.string().optional(),
});

// Define the table columns
const tableColumns = [
  { key: "FloorName", header: "Name" },
  { key: "FloorNumber", header: "Floor Number" },
  { key: "PropertyName", header: "Property" },
  { key: "CreatedBy", header: "Created By" },
  { key: "CreatedOn", header: "Created On" },
];

// Default values for the form
const defaultValues = {
  FloorName: "",
  FloorNumber: 0,
  PropertyID: 0,
  Description: "",
};

// Create a type-specific component to avoid JSX generic syntax issues
const FloorSettingsComponent = BaseSettingsComponent<Floor>;

export const FloorSettings = ({ properties, isLoadingProperties }: FloorSettingsProps) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const renderAdditionalFields = (form: any) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Property</label>
          <Select value={form.watch("PropertyID").toString() || "0"} onValueChange={(value) => form.setValue("PropertyID", parseInt(value))} disabled={isLoadingProperties}>
            <SelectTrigger>
              <SelectValue placeholder="Select Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0" disabled>
                Select Property
              </SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.PropertyID} value={property.PropertyID.toString()}>
                  {property.PropertyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.PropertyID && <p className="text-sm font-medium text-destructive">{form.formState.errors.PropertyID.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">Floor Number</label>
          <input
            type="number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register("FloorNumber", { valueAsNumber: true })}
          />
          {form.formState.errors.FloorNumber && <p className="text-sm font-medium text-destructive">{form.formState.errors.FloorNumber.message}</p>}
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-start mb-4">
        <div className="w-64">
          <label className="text-sm font-medium">Filter by Property</label>
          <Select value={selectedPropertyId?.toString() || ""} onValueChange={(value) => setSelectedPropertyId(value ? parseInt(value) : null)} disabled={isLoadingProperties}>
            <SelectTrigger>
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.PropertyID} value={property.PropertyID.toString()}>
                  {property.PropertyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FloorSettingsComponent
        entityType="Floor"
        entityName="Floor"
        schema={floorSchema}
        tableColumns={tableColumns}
        defaultValues={defaultValues}
        idKey="FloorID"
        nameKey="FloorName"
        renderAdditionalFields={renderAdditionalFields}
        additionalFilters={selectedPropertyId ? { PropertyID: selectedPropertyId } : undefined}
      />
    </div>
  );
};
