// src/pages/fiscalYear/FiscalYearForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, AlertTriangle } from "lucide-react";
import { fiscalYearService } from "@/services/fiscalYearService";
import { companyService } from "@/services/companyService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, addDays, isBefore, isAfter } from "date-fns";

// Create the schema for fiscal year form validation
const fiscalYearSchema = z
  .object({
    FYCode: z.string().min(1, "Fiscal year code is required").max(50, "Code cannot exceed 50 characters"),
    FYDescription: z.string().min(2, "Description must be at least 2 characters").max(250, "Description cannot exceed 250 characters"),
    StartDate: z.string().min(1, "Start date is required"),
    EndDate: z.string().min(1, "End date is required"),
    CompanyID: z.string().min(1, "Company is required"),
    IsActive: z.boolean().default(true),
    IsClosed: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.StartDate);
      const endDate = new Date(data.EndDate);
      return isBefore(startDate, endDate);
    },
    {
      message: "Start date must be before end date",
      path: ["EndDate"],
    }
  );

type FiscalYearFormValues = z.infer<typeof fiscalYearSchema>;

const FiscalYearForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [fiscalYear, setFiscalYear] = useState<FiscalYear | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [dateOverlapWarning, setDateOverlapWarning] = useState<string>("");

  // Initialize form
  const form = useForm<FiscalYearFormValues>({
    resolver: zodResolver(fiscalYearSchema),
    defaultValues: {
      FYCode: "",
      FYDescription: "",
      StartDate: "",
      EndDate: "",
      CompanyID: "",
      IsActive: true,
      IsClosed: false,
    },
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        setInitialLoading(true);

        // Fetch companies for dropdown
        const companiesData = await companyService.getCompaniesForDropdown(true);
        setCompanies(companiesData);

        // If editing, fetch the fiscal year data
        if (isEdit && id) {
          const fiscalYearData = await fiscalYearService.getFiscalYearById(parseInt(id));

          if (fiscalYearData) {
            setFiscalYear(fiscalYearData);

            // Set form values
            form.reset({
              FYCode: fiscalYearData.FYCode || "",
              FYDescription: fiscalYearData.FYDescription || "",
              StartDate: fiscalYearData.StartDate ? format(new Date(fiscalYearData.StartDate), "yyyy-MM-dd") : "",
              EndDate: fiscalYearData.EndDate ? format(new Date(fiscalYearData.EndDate), "yyyy-MM-dd") : "",
              CompanyID: fiscalYearData.CompanyID?.toString() || "",
              IsActive: fiscalYearData.IsActive !== undefined ? fiscalYearData.IsActive : true,
              IsClosed: fiscalYearData.IsClosed !== undefined ? fiscalYearData.IsClosed : false,
            });
          } else {
            toast.error("Fiscal year not found");
            navigate("/fiscal-years");
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

  // Watch for date and company changes to check for overlaps
  const watchedValues = form.watch(["StartDate", "EndDate", "CompanyID"]);

  useEffect(() => {
    const checkDateOverlap = async () => {
      const [startDate, endDate, companyId] = watchedValues;

      if (startDate && endDate && companyId) {
        try {
          const hasOverlap = await fiscalYearService.checkDateOverlap(parseInt(companyId), startDate, endDate, isEdit ? fiscalYear?.FiscalYearID : undefined);

          if (hasOverlap) {
            setDateOverlapWarning("Warning: The selected date range overlaps with an existing fiscal year for this company.");
          } else {
            setDateOverlapWarning("");
          }
        } catch (error) {
          console.error("Error checking date overlap:", error);
        }
      } else {
        setDateOverlapWarning("");
      }
    };

    const debounceTimer = setTimeout(checkDateOverlap, 500);
    return () => clearTimeout(debounceTimer);
  }, [watchedValues, isEdit, fiscalYear?.FiscalYearID]);

  // Auto-generate fiscal year code based on dates
  const generateFYCode = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();

      if (startYear === endYear) {
        return `FY${startYear}`;
      } else {
        return `FY${startYear}-${endYear.toString().slice(-2)}`;
      }
    }
    return "";
  };

  // Auto-generate description based on dates
  const generateDescription = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `Fiscal Year ${format(start, "yyyy")} - ${format(end, "yyyy")}`;
    }
    return "";
  };

  // Handle start date change
  const handleStartDateChange = (value: string) => {
    form.setValue("StartDate", value);

    // Auto-generate end date (one year minus one day)
    if (value && !form.getValues("EndDate")) {
      const startDate = new Date(value);
      const endDate = addDays(new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate()), -1);
      form.setValue("EndDate", format(endDate, "yyyy-MM-dd"));
    }

    // Auto-generate code and description if not in edit mode
    if (!isEdit) {
      const endDate = form.getValues("EndDate");
      if (endDate) {
        const generatedCode = generateFYCode(value, endDate);
        const generatedDescription = generateDescription(value, endDate);

        if (!form.getValues("FYCode")) {
          form.setValue("FYCode", generatedCode);
        }
        if (!form.getValues("FYDescription")) {
          form.setValue("FYDescription", generatedDescription);
        }
      }
    }
  };

  // Handle end date change
  const handleEndDateChange = (value: string) => {
    form.setValue("EndDate", value);

    // Auto-generate code and description if not in edit mode
    if (!isEdit) {
      const startDate = form.getValues("StartDate");
      if (startDate) {
        const generatedCode = generateFYCode(startDate, value);
        const generatedDescription = generateDescription(startDate, value);

        if (!form.getValues("FYCode")) {
          form.setValue("FYCode", generatedCode);
        }
        if (!form.getValues("FYDescription")) {
          form.setValue("FYDescription", generatedDescription);
        }
      }
    }
  };

  // Submit handler for the form
  const onSubmit = async (data: FiscalYearFormValues) => {
    setLoading(true);
    setValidationErrors([]);

    try {
      // Prepare fiscal year data
      const fiscalYearData = {
        FYCode: data.FYCode,
        FYDescription: data.FYDescription,
        StartDate: data.StartDate,
        EndDate: data.EndDate,
        CompanyID: parseInt(data.CompanyID),
        IsActive: data.IsActive,
        IsClosed: data.IsClosed,
      };

      if (isEdit && fiscalYear) {
        // Update existing fiscal year
        const result = await fiscalYearService.updateFiscalYear({
          ...fiscalYearData,
          FiscalYearID: fiscalYear.FiscalYearID,
        });

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/fiscal-years");
        } else {
          toast.error(result.Message);
        }
      } else {
        // Create new fiscal year
        const result = await fiscalYearService.createFiscalYear(fiscalYearData);

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/fiscal-years");
        } else {
          toast.error(result.Message);
        }
      }
    } catch (error) {
      console.error("Error saving fiscal year:", error);
      toast.error("Failed to save fiscal year");
    } finally {
      setLoading(false);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    navigate("/fiscal-years");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/fiscal-years")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Fiscal Year" : "Create Fiscal Year"}</h1>
      </div>

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {dateOverlapWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{dateOverlapWarning}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Fiscal Year" : "Create New Fiscal Year"}</CardTitle>
                <CardDescription>{isEdit ? "Update fiscal year information" : "Enter the details for the new fiscal year"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField form={form} name="FYCode" label="Fiscal Year Code" placeholder="e.g., FY2024-25" required />
                  <FormField form={form} name="FYDescription" label="Description" placeholder="e.g., Fiscal Year 2024 - 2025" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField form={form} name="StartDate" label="Start Date" type="date" required onChange={handleStartDateChange} />
                  <FormField form={form} name="EndDate" label="End Date" type="date" required onChange={handleEndDateChange} />
                </div>

                <FormField
                  form={form}
                  name="CompanyID"
                  label="Company"
                  type="select"
                  options={companies.map((company) => ({
                    label: company.CompanyName,
                    value: company.CompanyID.toString(),
                  }))}
                  placeholder="Select company"
                  required
                />

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Status Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label>Active Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="is-active" checked={form.watch("IsActive")} onCheckedChange={(checked) => form.setValue("IsActive", checked)} />
                        <Label htmlFor="is-active" className="cursor-pointer">
                          {form.watch("IsActive") ? "Active" : "Inactive"}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">Active fiscal years can be used for new transactions</p>
                    </div>

                    <div className="space-y-4">
                      <Label>Period Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="is-closed" checked={form.watch("IsClosed")} onCheckedChange={(checked) => form.setValue("IsClosed", checked)} />
                        <Label htmlFor="is-closed" className="cursor-pointer">
                          {form.watch("IsClosed") ? "Closed" : "Open"}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">Closed periods prevent new transactions from being posted</p>
                    </div>
                  </div>
                </div>

                {/* Helper Text */}
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Tips:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Fiscal year codes are automatically generated based on your date selection</li>
                    <li>• End date is automatically set to one year from start date</li>
                    <li>• Ensure date ranges do not overlap with existing fiscal years for the same company</li>
                    <li>• Only one fiscal year should be active per company at a time</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-6">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !!dateOverlapWarning}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Fiscal Year
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

export default FiscalYearForm;
