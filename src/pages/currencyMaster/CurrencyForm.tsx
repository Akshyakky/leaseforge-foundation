
// Just fixing the field props typing
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { currencyService, Currency } from "@/services/currencyService";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { FieldProps } from "@/components/forms/FormField";

// Form schema
const currencyFormSchema = z.object({
  CurrencyCode: z.string().min(1, "Currency code is required").max(10, "Currency code cannot exceed 10 characters"),
  CurrencyName: z.string().min(1, "Currency name is required").max(50, "Currency name cannot exceed 50 characters"),
  ConversionRate: z.number().positive("Conversion rate must be positive"),
  IsDefault: z.boolean().default(false),
});

type CurrencyFormValues = z.infer<typeof currencyFormSchema>;

const CurrencyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: {
      CurrencyCode: "",
      CurrencyName: "",
      ConversionRate: 1,
      IsDefault: false,
    },
  });

  // Fetch currency data if editing
  useEffect(() => {
    const fetchCurrencyData = async () => {
      if (id) {
        try {
          setLoading(true);
          setIsEditing(true);
          const data = await currencyService.getById(parseInt(id));
          
          form.reset({
            CurrencyCode: data.CurrencyCode,
            CurrencyName: data.CurrencyName,
            ConversionRate: data.ConversionRate,
            IsDefault: data.IsDefault,
          });
        } catch (error) {
          toast.error("Failed to load currency data");
          console.error("Error fetching currency:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCurrencyData();
  }, [id, form]);

  const onSubmit = async (data: CurrencyFormValues) => {
    setLoading(true);
    try {
      if (isEditing && id) {
        await currencyService.update({
          CurrencyID: parseInt(id),
          ...data,
        });
        toast.success("Currency updated successfully");
      } else {
        await currencyService.create(data);
        toast.success("Currency created successfully");
      }
      navigate("/currencies");
    } catch (error: any) {
      toast.error(error.message || "Failed to save currency");
    } finally {
      setLoading(false);
    }
  };

  // Type-safe field definitions
  const fields: (FieldProps<CurrencyFormValues, keyof CurrencyFormValues> & { type: string; placeholder: string; description: string; step?: string; min?: number })[] = [
    {
      name: "CurrencyCode",
      label: "Currency Code",
      type: "text",
      placeholder: "Enter currency code (e.g., USD)",
      description: "The ISO currency code (up to 10 characters)",
    },
    {
      name: "CurrencyName",
      label: "Currency Name",
      type: "text",
      placeholder: "Enter currency name (e.g., US Dollar)",
      description: "The full name of the currency",
    },
    {
      name: "ConversionRate",
      label: "Conversion Rate",
      type: "number",
      step: "0.0001",
      min: 0.0001,
      placeholder: "Enter conversion rate",
      description: "Rate relative to the base currency",
    },
    {
      name: "IsDefault",
      label: "Set as Default",
      type: "checkbox",
      placeholder: "",
      description: "Mark this currency as the default system currency",
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Currency" : "Add New Currency"}</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        {field.type === "checkbox" ? (
                          <Switch
                            checked={formField.value as boolean}
                            onCheckedChange={formField.onChange}
                          />
                        ) : (
                          <Input
                            placeholder={field.placeholder}
                            {...formField}
                            type={field.type}
                            step={field.step}
                            min={field.min}
                            disabled={loading}
                          />
                        )}
                      </FormControl>
                      <FormDescription>{field.description}</FormDescription>
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate("/currencies")} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEditing ? "Update Currency" : "Create Currency"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default CurrencyForm;
