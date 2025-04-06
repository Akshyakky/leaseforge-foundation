// src/pages/additionalCharges/AdditionalChargesForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw } from "lucide-react";
import { additionalChargesService, Charge } from "@/services/additionalChargesService";
import { additionalChargesCategoryService, ChargesCategory } from "@/services/additionalChargesCategoryService";
import { taxService } from "@/services/taxService";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// Create the schema for charge form validation
const chargeSchema = z.object({
  ChargesCode: z.string().min(1, "Charge code is required"),
  ChargesName: z.string().min(1, "Charge name is required"),
  ChargesCategoryID: z.string().min(1, "Category is required"),
  Description: z.string().optional(),
  IsPercentage: z.boolean().default(false),
  PercentageValue: z
    .number()
    .optional()
    .nullable()
    .refine((value) => {
      // If IsPercentage is true, PercentageValue is required and must be > 0
      return value === undefined || value === null || value > 0;
    }, "Percentage value must be greater than 0"),
  ChargeAmount: z
    .number()
    .optional()
    .nullable()
    .refine((value) => {
      // If IsPercentage is false, ChargeAmount is required and must be >= 0
      return value === undefined || value === null || value >= 0;
    }, "Charge amount must be greater than or equal to 0"),
  ApplicableOn: z.string().optional(),
  TaxID: z.string().optional(),
  CurrencyID: z.string().min(1, "Currency is required"),
  IsActive: z.boolean().default(true),
  IsDeposit: z.boolean().default(false),
  EffectiveFromDate: z.date().optional().nullable(),
  ExpiryDate: z.date().optional().nullable(),
});

type ChargeFormValues = z.infer<typeof chargeSchema>;

const AdditionalChargesForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [charge, setCharge] = useState<Charge | null>(null);

  // Reference data
  const [categories, setCategories] = useState<ChargesCategory[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  // Initialize form
  const form = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeSchema),
    defaultValues: {
      ChargesCode: "",
      ChargesName: "",
      ChargesCategoryID: "",
      Description: "",
      IsPercentage: false,
      PercentageValue: null,
      ChargeAmount: null,
      ApplicableOn: "",
      TaxID: "",
      CurrencyID: "",
      IsActive: true,
      IsDeposit: false,
      EffectiveFromDate: null,
      ExpiryDate: null,
    },
  });

  // Watch form values for conditional logic
  const isPercentage = form.watch("IsPercentage");

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch reference data in parallel
        const [categoriesData, taxesData, currenciesData] = await Promise.all([
          additionalChargesCategoryService.getAllCategories(),
          taxService.getAllTaxes(),
          // Placeholder - replace with actual currency service
          Promise.resolve([
            { CurrencyID: 1, CurrencyName: "USD" },
            { CurrencyID: 2, CurrencyName: "EUR" },
            { CurrencyID: 3, CurrencyName: "GBP" },
          ]),
        ]);

        setCategories(categoriesData);
        setTaxes(taxesData);
        setCurrencies(currenciesData);

        // If editing, fetch the charge data
        if (isEdit && id) {
          const chargeData = await additionalChargesService.getChargeById(parseInt(id));

          if (chargeData) {
            setCharge(chargeData);

            // Format dates for form
            const formattedData = {
              ...chargeData,
              EffectiveFromDate: chargeData.EffectiveFromDate ? new Date(chargeData.EffectiveFromDate) : null,
              ExpiryDate: chargeData.ExpiryDate ? new Date(chargeData.ExpiryDate) : null,
              ChargesCategoryID: chargeData.ChargesCategoryID?.toString() || "",
              TaxID: chargeData.TaxID?.toString() || "",
              CurrencyID: chargeData.CurrencyID?.toString() || "",
            };

            // Set form values
            form.reset(formattedData as any);
          } else {
            toast.error("Charge not found");
            navigate("/additional-charges");
          }
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error("Error loading form data");
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [id, isEdit, navigate, form]);

  // Handle form submission
  const onSubmit = async (data: ChargeFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      // Prepare charge data
      const chargeData: Partial<Charge> = {
        ChargesCode: data.ChargesCode,
        ChargesName: data.ChargesName,
        ChargesCategoryID: parseInt(data.ChargesCategoryID),
        Description: data.Description,
        IsPercentage: data.IsPercentage,
        PercentageValue: data.IsPercentage ? data.PercentageValue || undefined : undefined,
        ChargeAmount: !data.IsPercentage ? data.ChargeAmount || 0 : undefined,
        ApplicableOn: data.ApplicableOn,
        TaxID: data.TaxID ? parseInt(data.TaxID) : undefined,
        CurrencyID: parseInt(data.CurrencyID),
        IsActive: data.IsActive,
        IsDeposit: data.IsDeposit,
        EffectiveFromDate: data.EffectiveFromDate,
        ExpiryDate: data.ExpiryDate,
      };

      if (isEdit && charge) {
        // Update existing charge
        const success = await additionalChargesService.updateCharge({
          ...chargeData,
          ChargesID: charge.ChargesID,
        });

        if (success) {
          toast.success("Charge updated successfully");
          navigate("/additional-charges");
        } else {
          toast.error("Failed to update charge");
        }
      } else {
        // Create new charge
        const newChargeId = await additionalChargesService.createCharge(chargeData);

        if (newChargeId) {
          toast.success("Charge created successfully");
          navigate("/additional-charges");
        } else {
          toast.error("Failed to create charge");
        }
      }
    } catch (error) {
      console.error("Error saving charge:", error);
      toast.error("Failed to save charge");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (isEdit && charge) {
      form.reset({
        ...charge,
        EffectiveFromDate: charge.EffectiveFromDate ? new Date(charge.EffectiveFromDate) : null,
        ExpiryDate: charge.ExpiryDate ? new Date(charge.ExpiryDate) : null,
        ChargesCategoryID: charge.ChargesCategoryID?.toString() || "",
        TaxID: charge.TaxID?.toString() || "",
        CurrencyID: charge.CurrencyID?.toString() || "",
      } as any);
    } else {
      form.reset();
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate("/additional-charges");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/additional-charges")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Charge" : "Create Charge"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Charge" : "Create New Charge"}</CardTitle>
                <CardDescription>{isEdit ? "Update charge information" : "Enter details for the new charge"}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="ChargesCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Charge Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter charge code" {...field} disabled={isEdit} />
                        </FormControl>
                        <FormDescription>Unique identifier for the charge</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ChargesName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Charge Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter charge name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ChargesCategoryID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.ChargesCategoryID} value={category.ChargesCategoryID.toString()} disabled={!category.IsActive}>
                              {category.ChargesCategoryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="Description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter charge description" className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="IsPercentage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Percentage Based</FormLabel>
                        <FormDescription>Is this charge calculated as a percentage?</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isPercentage ? (
                  <FormField
                    control={form.control}
                    name="PercentageValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentage Value (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 5.5"
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>The percentage to be applied</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="ChargeAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Charge Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              {...field}
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="CurrencyID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency.CurrencyID} value={currency.CurrencyID.toString()}>
                                  {currency.CurrencyName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {isPercentage && (
                  <FormField
                    control={form.control}
                    name="ApplicableOn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Applicable On</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Rental Amount, Purchase Price" {...field} />
                        </FormControl>
                        <FormDescription>What is this percentage applied to?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="TaxID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tax (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">No Tax</SelectItem>
                          {taxes.map((tax) => (
                            <SelectItem key={tax.TaxID} value={tax.TaxID.toString()}>
                              {tax.TaxName} ({tax.TaxRate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Tax to be applied to this charge</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="EffectiveFromDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Effective From Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? field.value.toISOString().split("T")[0] : ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>When this charge becomes effective</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ExpiryDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? field.value.toISOString().split("T")[0] : ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>When this charge expires (optional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="IsActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>Is this charge currently active?</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="IsDeposit"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Deposit</FormLabel>
                          <FormDescription>Is this charge a deposit?</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>

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
                      {isEdit ? "Update Charge" : "Create Charge"}
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

export default AdditionalChargesForm;
