import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, RotateCcw, DollarSign } from "lucide-react";
import { currencyService, Currency } from "@/services/currencyService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useAppSelector } from "@/lib/hooks";

// Create the schema for currency form validation
const currencySchema = z.object({
  CurrencyCode: z.string().min(1, "Currency code is required").max(10, "Currency code cannot exceed 10 characters"),
  CurrencyName: z.string().min(2, "Currency name is required").max(50, "Currency name cannot exceed 50 characters"),
  ConversionRate: z.coerce.number().min(0.0001, "Conversion rate must be greater than 0").max(9999, "Conversion rate is too high"),
  IsDefault: z.boolean().default(false),
});

type CurrencyFormValues = z.infer<typeof currencySchema>;

const CurrencyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [hasDefaultCurrency, setHasDefaultCurrency] = useState(false);

  // Initialize form
  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      CurrencyCode: "",
      CurrencyName: "",
      ConversionRate: 1,
      IsDefault: false,
    },
  });

  // Check if a default currency exists
  useEffect(() => {
    const checkDefaultCurrency = async () => {
      try {
        const defaultCurrency = await currencyService.getDefaultCurrency();
        setHasDefaultCurrency(!!defaultCurrency);
      } catch (error) {
        console.error("Error checking default currency:", error);
      }
    };

    checkDefaultCurrency();
  }, []);

  // Initialize form with existing currency data if editing
  useEffect(() => {
    const initializeForm = async () => {
      if (isEdit && id) {
        try {
          setInitialLoading(true);
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
          }
        } catch (error) {
          console.error("Error fetching currency:", error);
          toast.error("Failed to load currency data");
          navigate("/currencies");
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [id, isEdit, navigate, form]);

  // Handle form submission
  const onSubmit = async (data: CurrencyFormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      if (isEdit && currency) {
        // Update existing currency
        const success = await currencyService.updateCurrency({
          CurrencyID: currency.CurrencyID,
          CurrencyCode: data.CurrencyCode,
          CurrencyName: data.CurrencyName,
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
          CurrencyCode: data.CurrencyCode,
          CurrencyName: data.CurrencyName,
          ConversionRate: data.ConversionRate,
          IsDefault: !hasDefaultCurrency || data.IsDefault, // If no default currency exists, this one becomes default
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="CurrencyCode"
                    label="Currency Code"
                    placeholder="Enter currency code (e.g., USD, EUR)"
                    required
                    maxLength={10}
                    description="A unique code identifier for the currency"
                  />
                  <FormField
                    form={form}
                    name="CurrencyName"
                    label="Currency Name"
                    placeholder="Enter currency name"
                    required
                    maxLength={50}
                    description="Full name of the currency"
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
                      <Switch
                        checked={form.watch("IsDefault")}
                        onCheckedChange={(checked) => form.setValue("IsDefault", checked)}
                        disabled={isEdit && currency?.IsDefault} // Can't unset default status of current default
                      />
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
                <Button type="submit" disabled={loading}>
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
