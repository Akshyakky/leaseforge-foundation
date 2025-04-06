
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { currencyService, Currency } from "@/services/currencyService";
import { toast } from "sonner";

const currencySchema = z.object({
  CurrencyCode: z.string().min(1, "Currency code is required").max(10, "Currency code must be 10 characters or less"),
  CurrencyName: z.string().min(1, "Currency name is required").max(100, "Currency name must be 100 characters or less"),
  ConversionRate: z.coerce.number().min(0, "Conversion rate must be a positive number"),
  IsDefault: z.boolean().optional(),
});

type FormData = z.infer<typeof currencySchema>;

const CurrencyForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<FormData>({
    CurrencyCode: "",
    CurrencyName: "",
    ConversionRate: 1,
    IsDefault: false,
  });

  // Load currency data if editing
  useEffect(() => {
    const loadCurrency = async () => {
      if (isEditing && id) {
        setLoading(true);
        try {
          const currency = await currencyService.getCurrencyById(parseInt(id));
          if (currency) {
            setInitialData({
              CurrencyCode: currency.CurrencyCode,
              CurrencyName: currency.CurrencyName,
              ConversionRate: currency.ConversionRate,
              IsDefault: currency.IsDefault,
            });
          } else {
            toast.error("Currency not found");
            navigate("/currencies");
          }
        } catch (error) {
          console.error("Error loading currency:", error);
          toast.error("Failed to load currency details");
        } finally {
          setLoading(false);
        }
      }
    };

    loadCurrency();
  }, [id, isEditing, navigate]);

  // Handle form submission
  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      let success: boolean | number | null;

      if (isEditing && id) {
        const updateData: Partial<Currency> & { CurrencyID: number } = {
          CurrencyID: parseInt(id),
          CurrencyCode: data.CurrencyCode,
          CurrencyName: data.CurrencyName,
          ConversionRate: data.ConversionRate,
          IsDefault: data.IsDefault,
        };
        success = await currencyService.updateCurrency(updateData);
      } else {
        const newCurrency: Partial<Currency> = {
          CurrencyCode: data.CurrencyCode,
          CurrencyName: data.CurrencyName,
          ConversionRate: data.ConversionRate,
          IsDefault: data.IsDefault,
        };
        success = await currencyService.createCurrency(newCurrency);
      }

      if (success) {
        navigate("/currencies");
      }
    } catch (error) {
      console.error("Error saving currency:", error);
      toast.error("Failed to save currency");
    } finally {
      setLoading(false);
    }
  };

  // Form fields configuration
  const fields = [
    {
      name: "CurrencyCode",
      label: "Currency Code",
      type: "text",
      placeholder: "e.g., USD, EUR, GBP",
      description: "The 3-letter ISO code for the currency",
    },
    {
      name: "CurrencyName",
      label: "Currency Name",
      type: "text",
      placeholder: "e.g., US Dollar, Euro, British Pound",
      description: "The full name of the currency",
    },
    {
      name: "ConversionRate",
      label: "Conversion Rate",
      type: "number",
      step: "0.0001",
      min: 0,
      placeholder: "1.0000",
      description: "The conversion rate relative to the base currency",
    },
    {
      name: "IsDefault",
      label: "Default Currency",
      type: "checkbox",
      description: "Set as the system's default currency (will affect all pricing calculations)",
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">
            {isEditing ? "Edit Currency" : "Add New Currency"}
          </CardTitle>
          <Button variant="outline" onClick={() => navigate("/currencies")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Currencies
          </Button>
        </CardHeader>
        <CardContent>
          {loading && !isEditing ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <FormBuilder
              fields={fields}
              schema={currencySchema}
              onSubmit={handleSubmit}
              defaultValues={initialData}
              isLoading={loading}
              submitText={isEditing ? "Update Currency" : "Create Currency"}
              cancelText="Cancel"
              onCancel={() => navigate("/currencies")}
              successMessage={isEditing ? "Currency updated successfully!" : "Currency created successfully!"}
              errorMessage="There was an error saving the currency"
              className="max-w-3xl mx-auto"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencyForm;
