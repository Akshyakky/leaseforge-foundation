import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { bankService } from "@/services/bankService";
import { Country, countryService } from "@/services/countryService";
import { toast } from "sonner";
import { Bank } from "@/types/bankTypes";

const bankSchema = z.object({
  BankCode: z.string().min(1, "Bank code is required").max(50, "Bank code must be 50 characters or less"),
  BankName: z.string().min(1, "Bank name is required").max(250, "Bank name must be 250 characters or less"),
  SwiftCode: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
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

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [bank, setBank] = useState<Bank | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);

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

  useEffect(() => {
    const initializeForm = async () => {
      try {
        const countriesData = await countryService.getCountriesForDropdown();
        setCountries(countriesData);
        if (countriesData && !isEdit) {
          const defaultCountry = await countryService.getDefaultCountry();
          form.setValue("CountryID", defaultCountry.CountryID.toString());
        }

        if (isEdit && id) {
          const bankData = await bankService.getBankById(parseInt(id));

          if (bankData) {
            setBank(bankData);
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

  const onSubmit = async (data: BankFormValues) => {
    setLoading(true);

    try {
      const bankData = {
        BankCode: data.BankCode.trim(),
        BankName: data.BankName.trim(),
        SwiftCode: data.SwiftCode?.trim() || undefined,
        CountryID: data.CountryID ? parseInt(data.CountryID) : undefined,
        IsActive: data.IsActive,
      };

      if (isEdit && bank) {
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

  const handleCancel = () => {
    navigate("/banks");
  };

  const handleSwiftCodeBlur = () => {
    const swiftCode = form.getValues("SwiftCode");
    if (swiftCode) {
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
                <FormField
                  control={form.control}
                  name="BankCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter bank code (e.g., ABC001)" {...field} />
                      </FormControl>
                      <FormDescription>Unique identifier for the bank</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="BankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter bank name" {...field} />
                      </FormControl>
                      <FormDescription>Full name of the bank</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="SwiftCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SWIFT Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter SWIFT code (e.g., ABCBUS33XXX)" {...field} onBlur={handleSwiftCodeBlur} />
                      </FormControl>
                      <FormDescription>Bank Identifier Code (BIC) for international transfers</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="CountryID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.CountryID} value={country.CountryID.toString()}>
                              {country.CountryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Country where the bank is located</FormDescription>
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Bank Status</FormLabel>
                        <FormDescription>Toggle to activate or deactivate this bank for transactions</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">SWIFT Code Format Information</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>First 4 characters: Bank code</p>
                  <p>Next 2 characters: Country code</p>
                  <p>Next 2 characters: Location code</p>
                  <p>Last 3 characters (optional): Branch code</p>
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
