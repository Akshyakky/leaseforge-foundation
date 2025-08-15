import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { bankService } from "@/services/bankService";
import { Country, countryService } from "@/services/countryService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Bank } from "@/types/bankTypes";

// Create the schema for bank form validation
const bankSchema = z.object({
  BankCode: z.string().min(1, "Bank code is required").max(50, "Bank code must be 50 characters or less"),
  BankName: z.string().min(1, "Bank name is required").max(250, "Bank name must be 250 characters or less"),
  SwiftCode: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        // SWIFT code format: 6 letters + 2 alphanumeric + optional 3 alphanumeric
        const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        return swiftRegex.test(val.trim());
      },
      {
        message: "Invalid SWIFT code format (e.g., ABCBUS33XXX)",
      }
    ),
  CountryID: z.string().optional(),
  IsActive: z.boolean(),
});

type BankFormValues = z.infer<typeof bankSchema>;

const BankForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [bank, setBank] = useState<Bank | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);

  // Initialize form
  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      BankCode: "",
      BankName: "",
      SwiftCode: "",
      CountryID: "",
      IsActive: true,
    },
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch countries for dropdown
        const countriesData = await countryService.getCountriesForDropdown();
        setCountries(countriesData);
        if (countriesData && !isEdit) {
          const defaultCountry = countriesData[0];
          form.setValue("CountryID", defaultCountry.CountryID.toString());
        }

        // If editing, fetch the bank data
        if (isEdit && id) {
          const bankData = await bankService.getBankById(parseInt(id));

          if (bankData) {
            setBank(bankData);

            // Set form values
            form.reset({
              BankCode: bankData.BankCode || "",
              BankName: bankData.BankName || "",
              SwiftCode: bankData.SwiftCode || "",
              CountryID: bankData.CountryID?.toString() || "",
              IsActive: bankData.IsActive,
            });
          } else {
            toast.error("Bank not found");
            navigate("/banks");
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

  // Submit handler for the bank form
  const onSubmit = async (data: BankFormValues) => {
    setLoading(true);

    try {
      // Prepare bank data
      const bankData = {
        BankCode: data.BankCode.trim(),
        BankName: data.BankName.trim(),
        SwiftCode: data.SwiftCode?.trim() || undefined,
        CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
        IsActive: data.IsActive,
      };

      if (isEdit && bank) {
        // Update existing bank
        const result = await bankService.updateBank({
          bank: { ...bankData, BankID: bank.BankID },
        });

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/banks");
        } else {
          toast.error(result.Message);
        }
      } else {
        // Create new bank
        const result = await bankService.createBank({
          bank: bankData,
        });

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/banks");
        } else {
          toast.error(result.Message);
        }
      }
    } catch (error) {
      console.error("Error saving bank:", error);
      toast.error("Failed to save bank");
    } finally {
      setLoading(false);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    navigate("/banks");
  };

  // Format SWIFT code on blur
  const handleSwiftCodeBlur = () => {
    const swiftCode = form.getValues("SwiftCode");
    if (swiftCode) {
      // Convert to uppercase
      form.setValue("SwiftCode", swiftCode.toUpperCase());
    }
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
        <Button variant="outline" size="icon" onClick={() => navigate("/banks")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Bank" : "Create Bank"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{isEdit ? "Edit Bank" : "Create New Bank"}</CardTitle>
              <CardDescription>{isEdit ? "Update bank information" : "Enter the details for the new bank"}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField form={form} name="BankCode" label="Bank Code" placeholder="Enter bank code (e.g., ABC001)" required description="Unique identifier for the bank" />
                <FormField form={form} name="BankName" label="Bank Name" placeholder="Enter bank name" required description="Full name of the bank" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="SwiftCode"
                  label="SWIFT Code"
                  placeholder="Enter SWIFT code (e.g., ABCBUS33XXX)"
                  description="Bank Identifier Code (BIC) for international transfers"
                  render={({ field }) => <Input {...field} placeholder="Enter SWIFT code (e.g., ABCBUS33XXX)" onBlur={handleSwiftCodeBlur} />}
                />
                <FormField
                  form={form}
                  name="CountryID"
                  label="Country"
                  type="select"
                  options={countries.map((country) => ({
                    label: country.CountryName,
                    value: country.CountryID.toString(),
                  }))}
                  placeholder="Select country"
                  description="Country where the bank is located"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField form={form} name="IsActive" label="Status" type="switch" description="Set to active to enable this bank for transactions" />
              </div>

              {/* SWIFT Code Information */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">SWIFT Code Format</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• First 4 characters: Bank code</p>
                  <p>• Next 2 characters: Country code</p>
                  <p>• Next 2 characters: Location code</p>
                  <p>• Last 3 characters (optional): Branch code</p>
                  <p className="text-xs mt-2">Example: ABCBUS33XXX or DEFGSG22</p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Bank
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

export default BankForm;
