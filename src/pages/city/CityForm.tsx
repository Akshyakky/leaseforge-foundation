import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { cityService, City } from "@/services/cityService";
import { countryService, Country } from "@/services/countryService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";

// Create the schema for city form validation
const citySchema = z.object({
  CityName: z.string().min(2, "City name must be at least 2 characters").max(100, "City name must not exceed 100 characters"),
  CityCode: z.string().max(10, "City code must not exceed 10 characters").optional().or(z.literal("")),
  CountryID: z.string().min(1, "Country is required"),
  StateID: z.string().optional().or(z.literal("")),
});

type CityFormValues = z.infer<typeof citySchema>;

const CityForm = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedCountryId = searchParams.get("countryId");
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [city, setCity] = useState<City | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);

  // Initialize form
  const form = useForm<CityFormValues>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      CityName: "",
      CityCode: "",
      CountryID: preselectedCountryId || "",
      StateID: "",
    },
  });

  // Fetch reference data and city data for editing
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch countries for dropdown
        const countriesData = await countryService.getCountriesForDropdown();
        setCountries(countriesData);

        // If editing, fetch city data
        if (isEdit && id) {
          const cityData = await cityService.getCityById(parseInt(id));

          if (cityData) {
            setCity(cityData);
            form.reset({
              CityName: cityData.CityName || "",
              CityCode: cityData.CityCode || "",
              CountryID: cityData.CountryID?.toString() || "",
              StateID: cityData.StateID?.toString() || "",
            });
          } else {
            toast.error("City not found");
            navigate("/cities");
          }
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error("Error loading form data");
        if (isEdit) {
          navigate("/cities");
        }
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [id, isEdit, navigate, form, preselectedCountryId]);

  // Submit handler
  const onSubmit = async (data: CityFormValues) => {
    setLoading(true);

    try {
      let success = false;

      const cityData: Partial<City> = {
        CityName: data.CityName,
        CityCode: data.CityCode || undefined,
        CountryID: parseInt(data.CountryID),
        StateID: data.StateID ? parseInt(data.StateID) : undefined,
      };

      if (isEdit && city) {
        // Update existing city
        success = await cityService.updateCity({
          ...cityData,
          CityID: city.CityID,
        });
      } else {
        // Create new city
        success = await cityService.createCity(cityData);
      }

      if (success) {
        navigate("/cities");
      }
    } catch (error) {
      console.error("Error saving city:", error);
      toast.error("Failed to save city");
    } finally {
      setLoading(false);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    navigate("/cities");
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/cities")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit City" : "Create City"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>{isEdit ? "Edit City" : "Create New City"}</CardTitle>
              <CardDescription>{isEdit ? "Update the city information below" : "Enter the details for the new city"}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField form={form} name="CityName" label="City Name" placeholder="e.g., New York, London, Dubai" description="Full name of the city" required />
                <FormField form={form} name="CityCode" label="City Code" placeholder="e.g., NYC, LON, DXB (optional)" description="A unique code to identify the city (optional)" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="CountryID"
                  label="Country"
                  type="select"
                  options={countries.map((country) => ({
                    label: country.CountryName,
                    value: country.CountryID.toString(),
                  }))}
                  placeholder="Select country"
                  description="The country where this city is located"
                  required
                />
                <FormField
                  form={form}
                  name="StateID"
                  label="State/Province ID"
                  placeholder="e.g., 1, 2, 3 (optional)"
                  description="State or province ID if applicable (optional)"
                />
              </div>

              {isEdit && city && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Record Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Created by:</span> {city.CreatedBy || "System"}
                    </div>
                    <div>
                      <span className="font-medium">Created on:</span> {city.CreatedOn ? new Date(city.CreatedOn).toLocaleString() : "Unknown"}
                    </div>
                    <div>
                      <span className="font-medium">Last updated by:</span> {city.UpdatedBy || "—"}
                    </div>
                    <div>
                      <span className="font-medium">Last updated on:</span> {city.UpdatedOn ? new Date(city.UpdatedOn).toLocaleString() : "—"}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEdit ? "Update City" : "Create City"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default CityForm;
