import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { taxService, Tax } from "@/services/taxService";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

// Form validation schema
const taxFormSchema = z
  .object({
    TaxCode: z.string().min(1, "Tax code is required").max(20, "Tax code cannot exceed 20 characters"),
    TaxName: z.string().min(1, "Tax name is required").max(100, "Tax name cannot exceed 100 characters"),
    TaxDescription: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    TaxCategory: z.string().optional(),
    TaxRate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%"),
    EffectiveFromDate: z.date().optional(),
    ExpiryDate: z.date().optional(),
    IsExemptOrZero: z.boolean().default(false),
    IsSalesTax: z.boolean().default(false),
    IsServiceTax: z.boolean().default(false),
    CountryID: z.number().optional(),
    Remark: z.string().max(500, "Remarks cannot exceed 500 characters").optional(),
  })
  .refine(
    (data) => {
      // If expiry date is provided, it should be after effective from date
      if (data.EffectiveFromDate && data.ExpiryDate) {
        return data.ExpiryDate > data.EffectiveFromDate;
      }
      return true;
    },
    {
      message: "Expiry date must be after effective date",
      path: ["ExpiryDate"],
    }
  );

// Form default values
const defaultValues = {
  TaxCode: "",
  TaxName: "",
  TaxDescription: "",
  TaxCategory: "",
  TaxRate: 0,
  EffectiveFromDate: undefined,
  ExpiryDate: undefined,
  IsExemptOrZero: false,
  IsSalesTax: false,
  IsServiceTax: false,
  CountryID: undefined,
  Remark: "",
};

type TaxFormValues = z.infer<typeof taxFormSchema>;

const TaxForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { taxId } = useParams<{ taxId: string }>();
  const isEditMode = !!taxId;

  // State variables
  const [loading, setLoading] = useState(false);
  const [loadingTax, setLoadingTax] = useState(isEditMode);
  const [countries, setCountries] = useState<{ CountryID: number; CountryName: string }[]>([]);

  // Form setup
  const form = useForm<TaxFormValues>({
    resolver: zodResolver(taxFormSchema),
    defaultValues,
  });

  // Get common tax categories for suggestions
  const commonTaxCategories = ["VAT", "GST", "Sales Tax", "Service Tax", "Income Tax", "Property Tax", "Import Duty", "Excise Tax", "Corporate Tax", "Withholding Tax"];

  // Load tax data if in edit mode
  useEffect(() => {
    const fetchTaxData = async () => {
      if (isEditMode && taxId) {
        try {
          setLoadingTax(true);
          const tax = await taxService.getTaxById(parseInt(taxId));

          if (tax) {
            // Convert date strings to Date objects if they exist
            const formData = {
              ...tax,
              EffectiveFromDate: tax.EffectiveFromDate ? new Date(tax.EffectiveFromDate) : undefined,
              ExpiryDate: tax.ExpiryDate ? new Date(tax.ExpiryDate) : undefined,
            };

            // Set form values
            form.reset(formData);
          } else {
            toast.error("Tax not found");
            navigate("/taxes");
          }
        } catch (error) {
          console.error("Error loading tax:", error);
          toast.error("Failed to load tax details");
        } finally {
          setLoadingTax(false);
        }
      }
    };

    fetchTaxData();
    fetchCountries();
  }, [isEditMode, taxId, form, navigate]);

  // Fetch countries
  const fetchCountries = async () => {
    try {
      // This is a placeholder. You'll need to implement a countryService
      // For now, we'll use an empty array
      setCountries([]);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  // Form submission handler
  const onSubmit = async (values: TaxFormValues) => {
    try {
      setLoading(true);
      let success = false;

      if (isEditMode) {
        // Update existing tax
        success = await taxService.updateTax({
          ...values,
          TaxID: parseInt(taxId as string),
        });
      } else {
        // Create new tax
        success = await taxService.createTax(values);
      }

      if (success) {
        toast.success(`Tax ${isEditMode ? "updated" : "created"} successfully`);
        navigate("/taxes");
      } else {
        toast.error(`Failed to ${isEditMode ? "update" : "create"} tax`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} tax:`, error);
      toast.error(`Error ${isEditMode ? "updating" : "creating"} tax. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation back to tax list
  const handleBack = () => {
    navigate("/taxes");
  };

  // Handle tax type selection
  const handleTaxTypeChange = (field: keyof TaxFormValues, checked: boolean) => {
    form.setValue(field, checked);

    // Clear other tax type checkboxes
    if (checked) {
      if (field === "IsExemptOrZero") {
        form.setValue("IsSalesTax", false);
        form.setValue("IsServiceTax", false);
      } else if (field === "IsSalesTax") {
        form.setValue("IsExemptOrZero", false);
        form.setValue("IsServiceTax", false);
      } else if (field === "IsServiceTax") {
        form.setValue("IsExemptOrZero", false);
        form.setValue("IsSalesTax", false);
      }
    }
  };

  if (loadingTax) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading tax data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={handleBack} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">{isEditMode ? "Edit Tax" : "Add New Tax"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Tax Information" : "New Tax Information"}</CardTitle>
          <CardDescription>{isEditMode ? "Update the tax details below" : "Fill in the details to create a new tax"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tax Code */}
                <FormField
                  control={form.control}
                  name="TaxCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Code *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter tax code" />
                      </FormControl>
                      <FormDescription>A unique identifier for this tax (e.g., VAT-20, GST-18)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Name */}
                <FormField
                  control={form.control}
                  name="TaxName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter tax name" />
                      </FormControl>
                      <FormDescription>The display name for this tax</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Rate */}
                <FormField
                  control={form.control}
                  name="TaxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%) *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} placeholder="Enter tax rate" />
                      </FormControl>
                      <FormDescription>The percentage rate for this tax</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Category */}
                <FormField
                  control={form.control}
                  name="TaxCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonTaxCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>The classification of this tax</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country */}
                {countries.length > 0 && (
                  <FormField
                    control={form.control}
                    name="CountryID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()} value={field.value?.toString() || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.CountryID} value={country.CountryID.toString()}>
                                {country.CountryName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>The country this tax applies to</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Effective From Date */}
                <FormField
                  control={form.control}
                  name="EffectiveFromDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Effective From Date</FormLabel>
                      <DatePicker value={field.value} onChange={field.onChange} />
                      <FormDescription>The date from which this tax is effective</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expiry Date */}
                <FormField
                  control={form.control}
                  name="ExpiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiry Date</FormLabel>
                      <DatePicker value={field.value} onChange={field.onChange} disabled={!form.getValues("EffectiveFromDate")} />
                      <FormDescription>The date after which this tax expires</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tax Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Is Exempt or Zero */}
                  <FormField
                    control={form.control}
                    name="IsExemptOrZero"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={(checked) => handleTaxTypeChange("IsExemptOrZero", checked as boolean)} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Exempt/Zero-Rated Tax</FormLabel>
                          <FormDescription>Tax is exempt or zero-rated</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Is Sales Tax */}
                  <FormField
                    control={form.control}
                    name="IsSalesTax"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={(checked) => handleTaxTypeChange("IsSalesTax", checked as boolean)} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Sales Tax</FormLabel>
                          <FormDescription>Applied to sales of goods</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Is Service Tax */}
                  <FormField
                    control={form.control}
                    name="IsServiceTax"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={(checked) => handleTaxTypeChange("IsServiceTax", checked as boolean)} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Service Tax</FormLabel>
                          <FormDescription>Applied to services</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Tax Description */}
              <FormField
                control={form.control}
                name="TaxDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter a detailed description of this tax" className="min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remarks */}
              <FormField
                control={form.control}
                name="Remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter any additional notes or remarks" className="min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="flex justify-between px-0">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? "Update Tax" : "Create Tax"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxForm;
