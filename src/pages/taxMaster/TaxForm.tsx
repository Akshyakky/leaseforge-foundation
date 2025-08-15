import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw, Percent } from "lucide-react";
import { taxService, Tax } from "@/services/taxService";
import { countryService } from "@/services/countryService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useAppSelector } from "@/lib/hooks";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Create the schema for tax form validation
const taxSchema = z
  .object({
    TaxCode: z.string().min(1, "Tax code is required").max(20, "Tax code cannot exceed 20 characters"),
    TaxName: z.string().min(2, "Tax name is required").max(50, "Tax name cannot exceed 50 characters"),
    TaxDescription: z.string().optional(),
    TaxCategory: z.string().optional(),
    TaxRate: z.coerce.number().min(0, "Tax rate must be 0 or greater").max(100, "Tax rate cannot exceed 100%"),
    EffectiveFromDate: z.date().optional().nullable(),
    ExpiryDate: z.date().optional().nullable(),
    IsExemptOrZero: z.boolean().default(false),
    IsSalesTax: z.boolean().default(false),
    IsServiceTax: z.boolean().default(false),
    CountryID: z.string().optional(),
    Remark: z.string().optional(),
  })
  .refine(
    (data) => {
      // If IsExemptOrZero is true, TaxRate should be 0
      if (data.IsExemptOrZero && data.TaxRate !== 0) {
        return false;
      }
      return true;
    },
    {
      message: "Tax rate must be 0 when marked as exempt or zero-rated",
      path: ["TaxRate"],
    }
  )
  .refine(
    (data) => {
      // Ensure ExpiryDate is after EffectiveFromDate if both are provided
      if (data.EffectiveFromDate && data.ExpiryDate && data.ExpiryDate < data.EffectiveFromDate) {
        return false;
      }
      return true;
    },
    {
      message: "Expiry date must be after effective date",
      path: ["ExpiryDate"],
    }
  );

type TaxFormValues = z.infer<typeof taxSchema>;

const TaxForm: React.FC = () => {
  const { taxId } = useParams<{ taxId: string }>();
  const isEdit = !!taxId;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [tax, setTax] = useState<Tax | null>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("basic");

  // Initialize form
  const form = useForm<TaxFormValues>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      TaxCode: "",
      TaxName: "",
      TaxDescription: "",
      TaxCategory: "",
      TaxRate: 0,
      EffectiveFromDate: null,
      ExpiryDate: null,
      IsExemptOrZero: false,
      IsSalesTax: false,
      IsServiceTax: false,
      CountryID: "",
      Remark: "",
    },
  });

  // Watch form values for conditional validations
  const isExemptOrZero = form.watch("IsExemptOrZero");

  useEffect(() => {
    // When IsExemptOrZero is true, set TaxRate to 0
    if (isExemptOrZero) {
      form.setValue("TaxRate", 0);
    }
  }, [isExemptOrZero, form]);

  // Fetch countries for dropdown
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countriesData = await countryService.getCountriesForDropdown();
        setCountries(countriesData);

        if (countriesData && !isEdit) {
          const defaultCountry = await countryService.getDefaultCountry();
          form.setValue("CountryID", defaultCountry.CountryID.toString());
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    fetchCountries();
  }, []);

  // Initialize form with existing tax data if editing
  useEffect(() => {
    const initializeForm = async () => {
      if (isEdit && taxId) {
        try {
          setInitialLoading(true);
          const taxData = await taxService.getTaxById(parseInt(taxId));

          if (taxData) {
            setTax(taxData);
            form.reset({
              TaxCode: taxData.TaxCode,
              TaxName: taxData.TaxName,
              TaxDescription: taxData.TaxDescription || "",
              TaxCategory: taxData.TaxCategory || "",
              TaxRate: taxData.TaxRate,
              EffectiveFromDate: taxData.EffectiveFromDate ? new Date(taxData.EffectiveFromDate) : null,
              ExpiryDate: taxData.ExpiryDate ? new Date(taxData.ExpiryDate) : null,
              IsExemptOrZero: taxData.IsExemptOrZero,
              IsSalesTax: taxData.IsSalesTax,
              IsServiceTax: taxData.IsServiceTax,
              CountryID: taxData.CountryID ? taxData.CountryID.toString() : "",
              Remark: taxData.Remark || "",
            });
          } else {
            toast.error("Tax not found");
            navigate("/taxes");
          }
        } catch (error) {
          console.error("Error fetching tax:", error);
          toast.error("Failed to load tax data");
          navigate("/taxes");
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [taxId, isEdit, navigate, form]);

  // Handle form submission
  const onSubmit = async (data: TaxFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      // Prepare tax data
      const taxData: Partial<Tax> = {
        TaxCode: data.TaxCode,
        TaxName: data.TaxName,
        TaxDescription: data.TaxDescription,
        TaxCategory: data.TaxCategory,
        TaxRate: data.TaxRate,
        EffectiveFromDate: data.EffectiveFromDate,
        ExpiryDate: data.ExpiryDate,
        IsExemptOrZero: data.IsExemptOrZero,
        IsSalesTax: data.IsSalesTax,
        IsServiceTax: data.IsServiceTax,
        CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
        Remark: data.Remark,
      };

      if (isEdit && tax) {
        // Update existing tax
        const success = await taxService.updateTax({
          ...taxData,
          TaxID: tax.TaxID,
        });

        if (success) {
          toast.success("Tax updated successfully");
          navigate("/taxes");
        } else {
          toast.error("Failed to update tax");
        }
      } else {
        // Create new tax
        const success = await taxService.createTax(taxData);

        if (success) {
          toast.success("Tax created successfully");
          navigate("/taxes");
        } else {
          toast.error("Failed to create tax");
        }
      }
    } catch (error) {
      console.error("Error saving tax:", error);
      toast.error("Failed to save tax");
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial values
  const handleReset = () => {
    if (isEdit && tax) {
      form.reset({
        TaxCode: tax.TaxCode,
        TaxName: tax.TaxName,
        TaxDescription: tax.TaxDescription || "",
        TaxCategory: tax.TaxCategory || "",
        TaxRate: tax.TaxRate,
        EffectiveFromDate: tax.EffectiveFromDate ? new Date(tax.EffectiveFromDate) : null,
        ExpiryDate: tax.ExpiryDate ? new Date(tax.ExpiryDate) : null,
        IsExemptOrZero: tax.IsExemptOrZero,
        IsSalesTax: tax.IsSalesTax,
        IsServiceTax: tax.IsServiceTax,
        CountryID: tax.CountryID ? tax.CountryID.toString() : "",
        Remark: tax.Remark || "",
      });
    } else {
      form.reset({
        TaxCode: "",
        TaxName: "",
        TaxDescription: "",
        TaxCategory: "",
        TaxRate: 0,
        EffectiveFromDate: null,
        ExpiryDate: null,
        IsExemptOrZero: false,
        IsSalesTax: false,
        IsServiceTax: false,
        CountryID: "",
        Remark: "",
      });
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate("/taxes");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/taxes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Tax" : "Create Tax"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Tax" : "Create New Tax"}</CardTitle>
                <CardDescription>{isEdit ? "Update tax information" : "Enter details for the new tax"}</CardDescription>
              </CardHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="advanced">Additional Details</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="basic" className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      form={form}
                      name="TaxCode"
                      label="Tax Code"
                      placeholder="Enter tax code (e.g., VAT, GST)"
                      required
                      maxLength={20}
                      description="A unique code identifier for the tax"
                    />
                    <FormField form={form} name="TaxName" label="Tax Name" placeholder="Enter tax name" required maxLength={50} description="Full name of the tax" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      form={form}
                      name="TaxRate"
                      label="Tax Rate (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      required
                      description="Tax rate as a percentage"
                      disabled={form.watch("IsExemptOrZero")}
                    />
                    <FormField
                      form={form}
                      name="TaxCategory"
                      label="Tax Category"
                      placeholder="E.g., Standard, Reduced, Special"
                      description="Categorization of the tax (optional)"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      form={form}
                      name="EffectiveFromDate"
                      label="Effective From Date"
                      type="date"
                      placeholder="Select start date"
                      description="When this tax rate becomes effective"
                    />
                    <FormField
                      form={form}
                      name="ExpiryDate"
                      label="Expiry Date"
                      type="date"
                      placeholder="Select end date"
                      description="When this tax rate expires (if applicable)"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      form={form}
                      name="CountryID"
                      label="Country"
                      type="select"
                      options={[
                        { label: "Global (All Countries)", value: "0" },
                        ...countries.map((country) => ({
                          label: country.CountryName,
                          value: country.CountryID.toString(),
                        })),
                      ]}
                      placeholder="Select country (leave empty for global)"
                      description="Country where this tax applies (optional)"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="p-6 pt-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Tax Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Exempt or Zero-Rated</p>
                          <p className="text-xs text-muted-foreground">Tax is exempt or has zero rate</p>
                        </div>
                        <Switch
                          checked={form.watch("IsExemptOrZero")}
                          onCheckedChange={(checked) => {
                            form.setValue("IsExemptOrZero", checked);
                            if (checked) {
                              form.setValue("TaxRate", 0);
                            }
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Sales Tax</p>
                          <p className="text-xs text-muted-foreground">Applies to sale of goods</p>
                        </div>
                        <Switch checked={form.watch("IsSalesTax")} onCheckedChange={(checked) => form.setValue("IsSalesTax", checked)} />
                      </div>

                      <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Service Tax</p>
                          <p className="text-xs text-muted-foreground">Applies to service offerings</p>
                        </div>
                        <Switch checked={form.watch("IsServiceTax")} onCheckedChange={(checked) => form.setValue("IsServiceTax", checked)} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <FormField
                      form={form}
                      name="TaxDescription"
                      label="Tax Description"
                      type="textarea"
                      placeholder="Enter detailed description of the tax"
                      description="Additional information about the tax"
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      form={form}
                      name="Remark"
                      label="Remarks"
                      type="textarea"
                      placeholder="Enter any additional notes or comments"
                      description="Internal notes about this tax (not visible to customers)"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <CardFooter className="flex justify-between border-t p-6">
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit ? "Update Tax" : "Create Tax"}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TaxForm;
