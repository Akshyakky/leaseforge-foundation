// src/pages/UnitMaster/Settings/CommunitySettings.tsx
import { useState, useEffect } from "react";
import { Community } from "../../../services/unitRelatedService";
import { BaseSettingsComponent } from "./BaseSettingsComponent";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import * as z from "zod";
import { countryService, cityService } from "@/services";

// Define the form schema
const communitySchema = z.object({
  CommunityName: z.string().min(1, "Community name is required"),
  CommunityCode: z.string().min(1, "Community code is required"),
  Description: z.string().optional(),
  CountryID: z.coerce.number().optional(),
  StateID: z.coerce.number().optional(),
  CityID: z.coerce.number().optional(),
  Location: z.string().optional(),
  ZipCode: z.string().optional(),
  IsActive: z.boolean().default(true),
  Remarks: z.string().optional(),
});

// Define the table columns
const tableColumns = [
  { key: "CommunityName", header: "Name" },
  { key: "CommunityCode", header: "Code" },
  { key: "CommunityDescription", header: "Description" },
  { key: "CountryName", header: "Country" },
  { key: "CityName", header: "City" },
  { key: "Location", header: "Location" },
  { key: "IsActive", header: "Status" },
  { key: "CreatedBy", header: "Created By" },
  { key: "CreatedOn", header: "Created On" },
];

// Default values for the form
const defaultValues = {
  CommunityName: "",
  CommunityCode: "",
  Description: "",
  CountryID: undefined,
  StateID: undefined,
  CityID: undefined,
  Location: "",
  ZipCode: "",
  IsActive: true,
  Remarks: "",
};

// Create a type-specific component to avoid JSX generic syntax issues
const CommunitySettingsComponent = BaseSettingsComponent<Community>;

export const CommunitySettings = () => {
  const [countries, setCountries] = useState<{ CountryID: number; CountryName: string }[]>([]);
  const [states, setStates] = useState<{ StateID: number; StateName: string }[]>([]);
  const [cities, setCities] = useState<{ CityID: number; CityName: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    setIsLoading(true);
    try {
      const countriesData = await countryService.getCountriesForDropdown();
      setCountries(countriesData);
    } catch (error) {
      console.error("Failed to load countries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCities = async (countryId: number) => {
    try {
      const citiesData = await cityService.getCitiesByCountry(countryId);
      setCities(citiesData);
    } catch (error) {
      console.error("Failed to load cities:", error);
    }
  };

  const renderAdditionalFields = (form: any) => {
    const watchCountry = form.watch("CountryID");

    // Load cities when country changes
    useEffect(() => {
      if (watchCountry) {
        loadCities(watchCountry);
      } else {
        setCities([]);
      }
    }, [watchCountry]);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="countryId">Country</Label>
            <Select
              value={form.watch("CountryID")?.toString() || ""}
              onValueChange={(value) => {
                form.setValue("CountryID", value ? parseInt(value) : undefined);
                // Reset city when country changes
                form.setValue("CityID", undefined);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Select Country</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.CountryID} value={country.CountryID.toString()}>
                    {country.CountryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cityId">City</Label>
            <Select value={form.watch("CityID")?.toString() || ""} onValueChange={(value) => form.setValue("CityID", value ? parseInt(value) : undefined)} disabled={!watchCountry}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={watchCountry ? "Select City" : "Select Country First"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Select City</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.CityID} value={city.CityID.toString()}>
                    {city.CityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="Location" {...form.register("Location")} />
          </div>

          <div>
            <Label htmlFor="zipCode">Zip Code</Label>
            <Input id="zipCode" placeholder="Zip Code" {...form.register("ZipCode")} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={form.watch("IsActive")} onCheckedChange={(checked) => form.setValue("IsActive", checked)} />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="remarks">Remarks</Label>
          <Input id="remarks" placeholder="Remarks" {...form.register("Remarks")} />
        </div>
      </div>
    );
  };

  const formatEntityForSubmit = (data: any) => {
    return {
      CommunityName: data.CommunityName,
      CommunityCode: data.CommunityCode,
      Description: data.Description,
      CountryID: data.CountryID,
      StateID: data.StateID,
      CityID: data.CityID,
      Location: data.Location,
      ZipCode: data.ZipCode,
      IsActive: data.IsActive,
      Remarks: data.Remarks,
    };
  };

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
      renderAdditionalFields={renderAdditionalFields}
      formatEntityForSubmit={formatEntityForSubmit}
    />
  );
};
