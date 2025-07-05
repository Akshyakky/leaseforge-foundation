import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, Calendar, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { paymentTermsService } from "@/services/paymentTermsService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import { PaymentTerms } from "@/types/paymentTermsTypes";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Create the schema for payment terms form validation
const paymentTermsSchema = z.object({
  TermCode: z
    .string()
    .min(1, "Term code is required")
    .max(50, "Term code cannot exceed 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Term code must contain only uppercase letters, numbers, hyphens, and underscores"),
  TermName: z.string().min(2, "Term name must be at least 2 characters").max(250, "Term name cannot exceed 250 characters"),
  DaysCount: z.number().min(0, "Days count cannot be negative").max(9999, "Days count cannot exceed 9999").optional().nullable(),
  Description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  IsActive: z.boolean().default(true),
});

type PaymentTermsFormValues = z.infer<typeof paymentTermsSchema>;

const PaymentTermsForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerms | null>(null);
  const [termCodeExists, setTermCodeExists] = useState(false);
  const [checkingTermCode, setCheckingTermCode] = useState(false);

  // Initialize form
  const form = useForm<PaymentTermsFormValues>({
    resolver: zodResolver(paymentTermsSchema),
    defaultValues: {
      TermCode: "",
      TermName: "",
      DaysCount: null,
      Description: "",
      IsActive: true,
    },
  });

  // Watch term code for validation
  const termCode = form.watch("TermCode");
  const daysCount = form.watch("DaysCount");

  // Initialize and fetch data for edit mode
  useEffect(() => {
    const initializeForm = async () => {
      if (isEdit && id) {
        try {
          const paymentTermData = await paymentTermsService.getPaymentTermById(parseInt(id));

          if (paymentTermData) {
            setPaymentTerm(paymentTermData);

            // Set form values
            form.reset({
              TermCode: paymentTermData.TermCode,
              TermName: paymentTermData.TermName,
              DaysCount: paymentTermData.DaysCount,
              Description: paymentTermData.Description || "",
              IsActive: paymentTermData.IsActive,
            });
          } else {
            toast.error("Payment term not found");
            navigate("/payment-terms");
          }
        } catch (error) {
          console.error("Error fetching payment term:", error);
          toast.error("Error loading payment term data");
          navigate("/payment-terms");
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [id, isEdit, navigate, form]);

  // Check term code uniqueness
  useEffect(() => {
    const checkTermCodeUniqueness = async () => {
      if (termCode && termCode.length >= 2) {
        setCheckingTermCode(true);
        try {
          const result = await paymentTermsService.checkTermCodeExists(termCode, isEdit ? paymentTerm?.PaymentTermID : undefined);
          setTermCodeExists(result.exists);
        } catch (error) {
          console.error("Error checking term code:", error);
        } finally {
          setCheckingTermCode(false);
        }
      } else {
        setTermCodeExists(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkTermCodeUniqueness, 500);
    return () => clearTimeout(timeoutId);
  }, [termCode, isEdit, paymentTerm?.PaymentTermID]);

  // Submit handler
  const onSubmit = async (data: PaymentTermsFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    if (termCodeExists) {
      toast.error("Term code already exists. Please choose a different code.");
      return;
    }

    setLoading(true);

    try {
      // Prepare payment terms data
      const paymentTermsData = {
        TermCode: data.TermCode.toUpperCase(), // Ensure uppercase
        TermName: data.TermName.trim(),
        DaysCount: data.DaysCount,
        Description: data.Description?.trim() || undefined,
        IsActive: data.IsActive,
      };

      if (isEdit && paymentTerm) {
        // Update existing payment term
        const result = await paymentTermsService.updatePaymentTerm({
          ...paymentTermsData,
          PaymentTermID: paymentTerm.PaymentTermID,
        });

        if (result.success) {
          toast.success(result.message);
          navigate("/payment-terms");
        } else {
          toast.error(result.message);
        }
      } else {
        // Create new payment term
        const result = await paymentTermsService.createPaymentTerm(paymentTermsData);

        if (result.success) {
          toast.success(result.message);
          navigate("/payment-terms");
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error("Error saving payment term:", error);
      toast.error("Failed to save payment term");
    } finally {
      setLoading(false);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    navigate("/payment-terms");
  };

  // Auto-format term code to uppercase
  const handleTermCodeChange = (value: string) => {
    const formattedValue = value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    form.setValue("TermCode", formattedValue);
  };

  // Get days count display text
  const getDaysCountDisplay = () => {
    if (daysCount === null || daysCount === undefined) {
      return "No specific payment period";
    }
    if (daysCount === 0) {
      return "Payment due immediately";
    }
    if (daysCount === 1) {
      return "Payment due in 1 day";
    }
    return `Payment due in ${daysCount} days`;
  };

  // Get days count category for styling
  const getDaysCountCategory = () => {
    if (daysCount === null || daysCount === undefined) return "none";
    if (daysCount === 0) return "immediate";
    if (daysCount <= 7) return "short";
    if (daysCount <= 30) return "medium";
    if (daysCount <= 60) return "long";
    return "extended";
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
        <Button variant="outline" size="icon" onClick={() => navigate("/payment-terms")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Payment Term" : "Create Payment Term"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{isEdit ? "Edit Payment Term" : "Create New Payment Term"}</CardTitle>
              <CardDescription>{isEdit ? "Update payment term information" : "Enter the details for the new payment term"}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormField
                    form={form}
                    name="TermCode"
                    label="Term Code"
                    placeholder="Enter term code (e.g., NET30)"
                    required
                    onChange={handleTermCodeChange}
                    description="Unique identifier for the payment term. Will be converted to uppercase."
                  />
                  {checkingTermCode && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Checking availability...
                    </div>
                  )}
                  {termCodeExists && (
                    <div className="flex items-center text-sm text-red-600">
                      <XCircle className="mr-1 h-3 w-3" />
                      This term code already exists
                    </div>
                  )}
                  {termCode && !checkingTermCode && !termCodeExists && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Term code is available
                    </div>
                  )}
                </div>

                <FormField
                  form={form}
                  name="TermName"
                  label="Term Name"
                  placeholder="Enter descriptive name (e.g., Net 30 Days)"
                  required
                  description="Human-readable name for the payment term."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormField
                    form={form}
                    name="DaysCount"
                    label="Days Count"
                    type="number"
                    placeholder="Enter number of days (optional)"
                    description="Number of days for payment. Leave empty for immediate payment or custom terms."
                  />

                  {/* Days count preview */}
                  <div className="p-3 border rounded-md bg-muted/20">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{getDaysCountDisplay()}</span>
                    </div>
                    {daysCount !== null && daysCount !== undefined && (
                      <div className="mt-1 text-xs text-muted-foreground">Category: {getDaysCountCategory().charAt(0).toUpperCase() + getDaysCountCategory().slice(1)} term</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    form={form}
                    name="Description"
                    label="Description"
                    type="textarea"
                    placeholder="Enter additional details about this payment term (optional)"
                    description="Optional description to provide more context about this payment term."
                  />
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Status Settings</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox id="IsActive" checked={form.watch("IsActive")} onCheckedChange={(checked) => form.setValue("IsActive", !!checked)} />
                  <label htmlFor="IsActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Active payment term
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Active payment terms are available for selection in contracts, invoices, and other transactions. Inactive terms are hidden from selection but existing records
                  using them remain unchanged.
                </p>
              </div>

              {/* Guidelines Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Guidelines:</strong> Use clear and consistent naming conventions for payment terms. Common examples include NET30 (30 days), NET15 (15 days), COD (Cash on
                  Delivery), or custom terms like 2/10NET30 (2% discount if paid within 10 days, otherwise due in 30 days).
                </AlertDescription>
              </Alert>

              {/* Preview Section */}
              {(form.watch("TermCode") || form.watch("TermName")) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Preview</h3>
                  <div className="p-4 border rounded-md bg-muted/10">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-medium text-lg">{form.watch("TermName") || "Payment Term Name"}</span>
                        <span className="ml-2 text-muted-foreground">({form.watch("TermCode") || "TERM_CODE"})</span>
                        {form.watch("IsActive") ? <CheckCircle className="ml-2 h-4 w-4 text-green-600" /> : <XCircle className="ml-2 h-4 w-4 text-red-600" />}
                      </div>
                      <div className="text-sm text-muted-foreground">{getDaysCountDisplay()}</div>
                      {form.watch("Description") && <div className="text-sm">{form.watch("Description")}</div>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || termCodeExists || checkingTermCode}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Payment Term
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

export default PaymentTermsForm;
