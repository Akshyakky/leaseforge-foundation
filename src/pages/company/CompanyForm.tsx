import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { companyService, Company } from "@/services/companyService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Country, countryService } from "@/services/countryService";
import { City, cityService } from "@/services/cityService";

const formSchema = z.object({
  CompanyName: z.string().min(2, "Company name must be at least 2 characters").max(150, "Company name cannot exceed 150 characters"),
  CompanyNo: z.string().optional(),
  CompanyAddress: z.string().optional(),
  CountryID: z.string().optional(),
  CityID: z.string().optional(),
  ContactNo: z.string().optional(),
  CompanyEmail: z.string().email("Please enter a valid email address").optional().or(z.string().length(0)),
  CompanyWeb: z.string().optional(),
  CompanyRemarks: z.string().optional(),
  TaxNo: z.string().optional(),
  IsActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const CompanyForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== "new";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [company, setCompany] = useState<Company | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      CompanyName: "",
      CompanyNo: "",
      CompanyAddress: "",
      CountryID: "",
      CityID: "",
      ContactNo: "",
      CompanyEmail: "",
      CompanyWeb: "",
      CompanyRemarks: "",
      TaxNo: "",
      IsActive: true,
    },
  });

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const countriesData = await countryService.getCountriesForDropdown();
        setCountries(countriesData);

        if (countriesData && !isEdit) {
          const defaultCountry = countriesData[0];
          setTimeout(() => {
            form.setValue("CountryID", defaultCountry.CountryID.toString());
          }, 0);
          if (defaultCountry.CountryID) {
            const citiesData = await cityService.getCitiesByCountry(defaultCountry.CountryID);
            setCities(citiesData);
            setSelectedCountryId(defaultCountry.CountryID.toString());
          }
        }
      } catch (error) {
        console.error("Error fetching reference data:", error);
      }
    };

    fetchReferenceData();
  }, [isEdit, company]);

  useEffect(() => {
    const fetchCitiesByCountry = async () => {
      if (selectedCountryId) {
        try {
          const citiesData = await cityService.getCitiesByCountry(parseInt(selectedCountryId));
          setCities(citiesData);
        } catch (error) {
          console.error("Error fetching cities:", error);
          setCities([]);
        }
      } else {
        setCities([]);
      }
    };

    fetchCitiesByCountry();
  }, [selectedCountryId]);

  useEffect(() => {
    const fetchCompany = async () => {
      if (isEdit && id) {
        try {
          const companyData = await companyService.getCompanyById(parseInt(id));
          if (companyData) {
            setCompany(companyData);
            form.reset({
              CompanyName: companyData.CompanyName,
              CompanyNo: companyData.CompanyNo || "",
              CompanyAddress: companyData.CompanyAddress || "",
              CountryID: companyData.CountryID?.toString() || "",
              CityID: companyData.CityID?.toString() || "",
              ContactNo: companyData.ContactNo || "",
              CompanyEmail: companyData.CompanyEmail || "",
              CompanyWeb: companyData.CompanyWeb || "",
              CompanyRemarks: companyData.CompanyRemarks || "",
              TaxNo: companyData.TaxNo || "",
              IsActive: companyData.IsActive,
            });
          } else {
            toast.error("Company not found");
            navigate("/companies");
          }
        } catch (error) {
          console.error("Error fetching company:", error);
          toast.error("Error loading company");
          navigate("/companies");
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    fetchCompany();
  }, [id, isEdit, navigate, form]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      let success;

      const companyData = {
        CompanyName: data.CompanyName,
        CompanyNo: data.CompanyNo,
        CompanyAddress: data.CompanyAddress,
        CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
        CityID: data.CityID ? parseInt(data.CityID) : undefined,
        ContactNo: data.ContactNo,
        CompanyEmail: data.CompanyEmail,
        CompanyWeb: data.CompanyWeb,
        CompanyRemarks: data.CompanyRemarks,
        TaxNo: data.TaxNo,
        IsActive: data.IsActive,
      };

      if (isEdit && company) {
        success = await companyService.updateCompany({
          ...companyData,
          CompanyID: company.CompanyID,
        });
      } else {
        success = await companyService.createCompany(companyData);
      }

      if (success) {
        navigate("/companies");
      }
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Failed to save company");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/companies");
  };

  const handleCountryChange = (value: string) => {
    // Update the form field
    form.setValue("CountryID", value);

    // Clear city if country changes
    form.setValue("CityID", "");

    // Set selected country to trigger city fetching
    setSelectedCountryId(value);
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
        <Button variant="outline" size="icon" onClick={() => navigate("/companies")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Company" : "Create Company"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Company" : "Create New Company"}</CardTitle>
          <CardDescription>{isEdit ? "Update the company details" : "Enter the details for the new company"}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField form={form} name="CompanyName" label="Company Name" placeholder="Enter company name" required />
                <FormField form={form} name="CompanyNo" label="Company No" placeholder="Enter company registration number" />
                <FormField form={form} name="TaxNo" label="Tax ID Number" placeholder="Enter tax identification number" />
                <FormField form={form} name="CompanyEmail" label="Email" placeholder="Enter company email" type="email" />
                <FormField form={form} name="CompanyWeb" label="Website" placeholder="Enter company website" />
                <FormField form={form} name="ContactNo" label="Contact Number" placeholder="Enter contact number" />
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
                  onChange={handleCountryChange}
                />
                <FormField
                  form={form}
                  name="CityID"
                  label="City"
                  type="select"
                  options={cities.map((city) => ({
                    label: city.CityName,
                    value: city.CityID.toString(),
                  }))}
                  placeholder={selectedCountryId ? "Select city" : "Select country first"}
                  disabled={!selectedCountryId}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-6">
                <FormField form={form} name="CompanyAddress" label="Address" placeholder="Enter company address" type="textarea" />
                <FormField form={form} name="CompanyRemarks" label="Remarks" placeholder="Additional notes or remarks" type="textarea" />
              </div>

              <Separator />

              <FormField
                form={form}
                name="IsActive"
                label="Active Status"
                render={({ field }) => (
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Active Status</label>
                      <p className="text-sm text-muted-foreground">Company will {!field.value && "not"} be active in the system</p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
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
                    Save Company
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default CompanyForm;
