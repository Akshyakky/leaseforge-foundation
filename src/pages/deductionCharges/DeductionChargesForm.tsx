// src/pages/deductionCharges/DeductionChargesForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw } from "lucide-react";
import { deductionService, Deduction } from "@/services/deductionService";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField as CustomFormField } from "@/components/forms/FormField";

// Create the schema for deduction form validation
const deductionSchema = z.object({
  DeductionCode: z.string().min(1, "Deduction code is required"),
  DeductionName: z.string().min(1, "Deduction name is required"),
  DeductionType: z.string().optional(),
  DeductionValue: z.number().min(0, "Deduction value must be greater than or equal to 0"),
  DeductionDescription: z.string().optional(),
  ApplicableOn: z.string().optional(),
  IsActive: z.boolean().default(true),
  EffectiveFromDate: z.date().optional().nullable(),
  ExpiryDate: z.date().optional().nullable(),
  Remark: z.string().optional(),
});

type DeductionFormValues = z.infer<typeof deductionSchema>;

const DeductionChargesForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [deduction, setDeduction] = useState<Deduction | null>(null);
  const [deductionTypes, setDeductionTypes] = useState<any[]>([]);

  // Initialize form
  const form = useForm<DeductionFormValues>({
    resolver: zodResolver(deductionSchema),
    defaultValues: {
      DeductionCode: "",
      DeductionName: "",
      DeductionType: "",
      DeductionValue: 0,
      DeductionDescription: "",
      ApplicableOn: "",
      IsActive: true,
      EffectiveFromDate: null,
      ExpiryDate: null,
      Remark: "",
    },
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch deduction types
        const typesData = await deductionService.getDeductionTypes();
        setDeductionTypes(typesData);

        // If editing, fetch the deduction data
        if (isEdit && id) {
          const deductionData = await deductionService.getDeductionById(parseInt(id));

          if (deductionData) {
            setDeduction(deductionData);

            // Format dates for form
            const formattedData = {
              ...deductionData,
              EffectiveFromDate: deductionData.EffectiveFromDate ? new Date(deductionData.EffectiveFromDate) : null,
              ExpiryDate: deductionData.ExpiryDate ? new Date(deductionData.ExpiryDate) : null,
            };

            // Set form values
            form.reset(formattedData as any);
          } else {
            toast.error("Deduction not found");
            navigate("/deduction-charges");
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
  const onSubmit = async (data: DeductionFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      // Prepare deduction data
      const deductionData: Partial<Deduction> = {
        DeductionCode: data.DeductionCode,
        DeductionName: data.DeductionName,
        DeductionType: data.DeductionType,
        DeductionValue: data.DeductionValue,
        DeductionDescription: data.DeductionDescription,
        ApplicableOn: data.ApplicableOn,
        IsActive: data.IsActive,
        EffectiveFromDate: data.EffectiveFromDate,
        ExpiryDate: data.ExpiryDate,
        Remark: data.Remark,
      };

      if (isEdit && deduction) {
        // Update existing deduction
        const success = await deductionService.updateDeduction({
          ...deductionData,
          DeductionID: deduction.DeductionID,
        });

        if (success) {
          toast.success("Deduction updated successfully");
          navigate("/deduction-charges");
        } else {
          toast.error("Failed to update deduction");
        }
      } else {
        // Create new deduction
        const newDeductionId = await deductionService.createDeduction(deductionData);

        if (newDeductionId) {
          toast.success("Deduction created successfully");
          navigate("/deduction-charges");
        } else {
          toast.error("Failed to create deduction");
        }
      }
    } catch (error) {
      console.error("Error saving deduction:", error);
      toast.error("Failed to save deduction");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (isEdit && deduction) {
      form.reset({
        ...deduction,
        EffectiveFromDate: deduction.EffectiveFromDate ? new Date(deduction.EffectiveFromDate) : null,
        ExpiryDate: deduction.ExpiryDate ? new Date(deduction.ExpiryDate) : null,
      } as any);
    } else {
      form.reset();
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate("/deduction-charges");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/deduction-charges")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Deduction" : "Create Deduction"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Deduction" : "Create New Deduction"}</CardTitle>
                <CardDescription>{isEdit ? "Update deduction information" : "Enter details for the new deduction"}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="DeductionCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deduction Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter deduction code" {...field} disabled={isEdit} />
                        </FormControl>
                        <FormDescription>Unique identifier for the deduction</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="DeductionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deduction Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter deduction name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="DeductionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deduction Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter deduction type (e.g., Tax, Insurance)" {...field} list="deduction-types" />
                        </FormControl>
                        <datalist id="deduction-types">
                          {deductionTypes.map((type, index) => (
                            <option key={index} value={type.DeductionType} />
                          ))}
                        </datalist>
                        <FormDescription>Type or category of deduction</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="DeductionValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deduction Value</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                        </FormControl>
                        <FormDescription>Value to be deducted</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ApplicableOn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applicable On</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Salary, Invoice Amount" {...field} />
                      </FormControl>
                      <FormDescription>What is this deduction applied to?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="DeductionDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter deduction description" className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date picker using CustomFormField */}
                  <CustomFormField
                    form={form}
                    name="EffectiveFromDate"
                    label="Effective From Date"
                    type="date"
                    placeholder="Select start date"
                    description="When this deduction becomes effective"
                  />

                  {/* Date picker using CustomFormField */}
                  <CustomFormField
                    form={form}
                    name="ExpiryDate"
                    label="Expiry Date"
                    type="date"
                    placeholder="Select end date"
                    description="When this deduction expires (optional)"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="Remark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter any additional notes or remarks" className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="IsActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>Is this deduction currently active?</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
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
                      {isEdit ? "Update Deduction" : "Create Deduction"}
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

export default DeductionChargesForm;
