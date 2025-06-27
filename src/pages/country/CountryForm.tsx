import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { countryService, Country } from "@/services/countryService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";

// Create the schema for country form validation
const countrySchema = z.object({
  CountryCode: z
    .string()
    .min(2, "Country code must be at least 2 characters")
    .max(10, "Country code must not exceed 10 characters")
    .regex(/^[A-Z0-9]+$/, "Country code must contain only uppercase letters and numbers"),
  CountryName: z.string().min(2, "Country name must be at least 2 characters").max(100, "Country name must not exceed 100 characters"),
});

type CountryFormValues = z.infer<typeof countrySchema>;

const CountryForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [country, setCountry] = useState<Country | null>(null);

  // Initialize form
  const form = useForm<CountryFormValues>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      CountryCode: "",
      CountryName: "",
    },
  });

  // Fetch country data for editing
  useEffect(() => {
    const fetchCountryData = async () => {
      if (!isEdit || !id) {
        setInitialLoading(false);
        return;
      }

      try {
        const countryData = await countryService.getCountryById(parseInt(id));

        if (countryData) {
          setCountry(countryData);
          form.reset({
            CountryCode: countryData.CountryCode || "",
            CountryName: countryData.CountryName || "",
          });
        } else {
          toast.error("Country not found");
          navigate("/countries");
        }
      } catch (error) {
        console.error("Error fetching country:", error);
        toast.error("Error loading country data");
        navigate("/countries");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCountryData();
  }, [id, isEdit, navigate, form]);

  // Submit handler
  const onSubmit = async (data: CountryFormValues) => {
    setLoading(true);

    try {
      let success = false;

      if (isEdit && country) {
        // Update existing country
        success = await countryService.updateCountry({
          CountryID: country.CountryID,
          CountryCode: data.CountryCode,
          CountryName: data.CountryName,
        });
      } else {
        // Create new country
        success = await countryService.createCountry({
          CountryCode: data.CountryCode,
          CountryName: data.CountryName,
        });
      }

      if (success) {
        navigate("/countries");
      }
    } catch (error) {
      console.error("Error saving country:", error);
      toast.error("Failed to save country");
    } finally {
      setLoading(false);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    navigate("/countries");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/countries")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Country" : "Create Country"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>{isEdit ? "Edit Country" : "Create New Country"}</CardTitle>
              <CardDescription>{isEdit ? "Update the country information below" : "Enter the details for the new country"}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="CountryCode"
                  label="Country Code"
                  placeholder="e.g., US, UK, AE"
                  description="A unique code to identify the country (2-10 characters, uppercase letters and numbers only)"
                  required
                />
                <FormField form={form} name="CountryName" label="Country Name" placeholder="e.g., United States, United Kingdom" description="Full name of the country" required />
              </div>

              {isEdit && country && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Record Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Created by:</span> {country.CreatedBy || "System"}
                    </div>
                    <div>
                      <span className="font-medium">Created on:</span> {country.CreatedOn ? new Date(country.CreatedOn).toLocaleString() : "Unknown"}
                    </div>
                    <div>
                      <span className="font-medium">Last updated by:</span> {country.UpdatedBy || "—"}
                    </div>
                    <div>
                      <span className="font-medium">Last updated on:</span> {country.UpdatedOn ? new Date(country.UpdatedOn).toLocaleString() : "—"}
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
                    {isEdit ? "Update Country" : "Create Country"}
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

export default CountryForm;
