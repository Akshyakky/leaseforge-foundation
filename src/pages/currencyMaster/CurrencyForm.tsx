import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw, DollarSign, AlertTriangle } from "lucide-react";
import { currencyService, Currency } from "@/services/currencyService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useAppSelector } from "@/lib/hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Enhanced schema with custom validation for duplicates
const createCurrencySchema = (existingCurrencies: Currency[], currentCurrencyId?: number) => {
  return z.object({
    CurrencyCode: z
      .string()
      .min(1, "Currency code is required")
      .max(10, "Currency code cannot exceed 10 characters")
      .refine((code) => {
        const normalizedCode = code.toUpperCase().trim();
        return !existingCurrencies.some((currency) => currency.CurrencyCode.toUpperCase() === normalizedCode && currency.CurrencyID !== currentCurrencyId);
      }, "Currency code already exists"),
    CurrencyName: z
      .string()
      .min(2, "Currency name is required")
      .max(50, "Currency name cannot exceed 50 characters")
      .refine((name) => {
        const normalizedName = name.toLowerCase().trim();
        return !existingCurrencies.some((currency) => currency.CurrencyName.toLowerCase() === normalizedName && currency.CurrencyID !== currentCurrencyId);
      }, "Currency name already exists"),
    ConversionRate: z.coerce.number().min(0.0001, "Conversion rate must be greater than 0").max(9999, "Conversion rate is too high"),
    IsDefault: z.boolean().default(false),
  });
};

type CurrencyFormValues = {
  CurrencyCode: string;
  CurrencyName: string;
  ConversionRate: number;
  IsDefault: boolean;
};

const CurrencyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [hasDefaultCurrency, setHasDefaultCurrency] = useState(false);
  const [existingCurrencies, setExistingCurrencies] = useState<Currency[]>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<{
    code?: string;
    name?: string;
  }>({});

  // Initialize form with dynamic schema
  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(createCurrencySchema(existingCurrencies, currency?.CurrencyID)),
    defaultValues: {
      CurrencyCode: "",
      CurrencyName: "",
      ConversionRate: 1,
      IsDefault: false,
    },
    mode: "onChange", // Enable real-time validation
  });

  // Load existing currencies and check for duplicates
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setInitialLoading(true);

        // Load all existing currencies for duplicate checking
        const allCurrencies = await currencyService.getAllCurrencies();
        setExistingCurrencies(allCurrencies);

        // Check if a default currency exists
        const defaultCurrency = await currencyService.getDefaultCurrency();
        setHasDefaultCurrency(!!defaultCurrency);

        // If editing, load the specific currency
        if (isEdit && id) {
          const currencyData = await currencyService.getCurrencyById(parseInt(id));

          if (currencyData) {
            setCurrency(currencyData);
            form.reset({
              CurrencyCode: currencyData.CurrencyCode,
              CurrencyName: currencyData.CurrencyName,
              ConversionRate: currencyData.ConversionRate,
              IsDefault: currencyData.IsDefault,
            });
          } else {
            toast.error("Currency not found");
            navigate("/currencies");
            return;
          }
        }

        // Update form resolver with loaded currencies
        form.trigger(); // Trigger validation with new data
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load currency data");
        if (isEdit) {
          navigate("/currencies");
        }
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, [id, isEdit, navigate, form]);

  // Real-time duplicate checking
  const checkForDuplicates = (code: string, name: string) => {
    const warnings: { code?: string; name?: string } = {};

    if (code.trim()) {
      const normalizedCode = code.toUpperCase().trim();
      const duplicateCode = existingCurrencies.find((curr) => curr.CurrencyCode.toUpperCase() === normalizedCode && curr.CurrencyID !== currency?.CurrencyID);

      if (duplicateCode) {
        warnings.code = `Currency code "${code}" is already used by ${duplicateCode.CurrencyName}`;
      }
    }

    if (name.trim()) {
      const normalizedName = name.toLowerCase().trim();
      const duplicateName = existingCurrencies.find((curr) => curr.CurrencyName.toLowerCase() === normalizedName && curr.CurrencyID !== currency?.CurrencyID);

      if (duplicateName) {
        warnings.name = `Currency name "${name}" already exists with code ${duplicateName.CurrencyCode}`;
      }
    }

    setDuplicateWarnings(warnings);
  };

  // Watch form values for real-time duplicate checking
  const watchedCode = form.watch("CurrencyCode");
  const watchedName = form.watch("CurrencyName");

  useEffect(() => {
    if (existingCurrencies.length > 0) {
      checkForDuplicates(watchedCode || "", watchedName || "");
    }
  }, [watchedCode, watchedName, existingCurrencies, currency?.CurrencyID]);

  // Update form resolver when existing currencies change
  useEffect(() => {
    if (existingCurrencies.length > 0) {
      const newResolver = zodResolver(createCurrencySchema(existingCurrencies, currency?.CurrencyID));
      form.trigger(); // Re-validate with new resolver
    }
  }, [existingCurrencies, currency?.CurrencyID, form]);

  // Handle form submission
  const onSubmit = async (data: CurrencyFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    // Final duplicate check before submission
    const hasDuplicates = Object.keys(duplicateWarnings).length > 0;
    if (hasDuplicates) {
      toast.error("Please resolve duplicate currency issues before saving");
      return;
    }

    setLoading(true);

    try {
      if (isEdit && currency) {
        // Update existing currency
        const success = await currencyService.updateCurrency({
          CurrencyID: currency.CurrencyID,
          CurrencyCode: data.CurrencyCode.trim(),
          CurrencyName: data.CurrencyName.trim(),
          ConversionRate: data.ConversionRate,
          IsDefault: data.IsDefault,
        });

        if (success) {
          toast.success("Currency updated successfully");
          navigate("/currencies");
        } else {
          toast.error("Failed to update currency");
        }
      } else {
        // Create new currency
        const newCurrencyId = await currencyService.createCurrency({
          CurrencyCode: data.CurrencyCode.trim(),
          CurrencyName: data.CurrencyName.trim(),
          ConversionRate: data.ConversionRate,
          IsDefault: !hasDefaultCurrency || data.IsDefault,
        });

        if (newCurrencyId) {
          toast.success("Currency created successfully");
          navigate("/currencies");
        } else {
          toast.error("Failed to create currency");
        }
      }
    } catch (error) {
      console.error("Error saving currency:", error);
      toast.error("Failed to save currency");
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial values
  const handleReset = () => {
    if (isEdit && currency) {
      form.reset({
        CurrencyCode: currency.CurrencyCode,
        CurrencyName: currency.CurrencyName,
        ConversionRate: currency.ConversionRate,
        IsDefault: currency.IsDefault,
      });
    } else {
      form.reset({
        CurrencyCode: "",
        CurrencyName: "",
        ConversionRate: 1,
        IsDefault: false,
      });
    }
    setDuplicateWarnings({});
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate("/currencies");
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasValidationErrors = Object.keys(form.formState.errors).length > 0;
  const hasDuplicateIssues = Object.keys(duplicateWarnings).length > 0;
  const canSubmit = !hasValidationErrors && !hasDuplicateIssues && !loading;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/currencies")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Currency" : "Create Currency"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Currency" : "Create New Currency"}</CardTitle>
                <CardDescription>{isEdit ? "Update currency information" : "Enter details for the new currency"}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Duplicate warnings */}
                {hasDuplicateIssues && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Duplicate Currency Detected:</p>
                        {duplicateWarnings.code && <p>• {duplicateWarnings.code}</p>}
                        {duplicateWarnings.name && <p>• {duplicateWarnings.name}</p>}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="CurrencyCode"
                    label="Currency Code"
                    placeholder="Enter currency code (e.g., USD, EUR)"
                    required
                    maxLength={10}
                    description="A unique code identifier for the currency"
                    className={duplicateWarnings.code ? "border-red-500" : ""}
                  />
                  <FormField
                    form={form}
                    name="CurrencyName"
                    label="Currency Name"
                    placeholder="Enter currency name"
                    required
                    maxLength={50}
                    description="Full name of the currency"
                    className={duplicateWarnings.name ? "border-red-500" : ""}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="ConversionRate"
                    label="Conversion Rate"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    max="9999"
                    placeholder="1.0000"
                    required
                    description="Exchange rate relative to the default currency"
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Currency</label>
                    <div className="flex items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Set as Default</p>
                        <p className="text-sm text-muted-foreground">
                          {hasDefaultCurrency && !currency?.IsDefault ? "Warning: This will change the default currency" : "Use this as the base currency for all conversions"}
                        </p>
                      </div>
                      <Switch checked={form.watch("IsDefault")} onCheckedChange={(checked) => form.setValue("IsDefault", checked)} disabled={isEdit && currency?.IsDefault} />
                    </div>
                  </div>
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
                <Button type="submit" disabled={!canSubmit}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit ? "Update Currency" : "Create Currency"}
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

export default CurrencyForm;
