// src/pages/account/AccountTypeForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { accountService } from "@/services/accountService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { AccountType } from "@/types/accountTypes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Create the schema for account type form validation
const accountTypeSchema = z.object({
  AccountTypeCode: z.string().min(1, "Account type code is required"),
  AccountTypeName: z.string().min(2, "Account type name must be at least 2 characters"),
  ParentAccountTypeID: z.string().optional(),
  AccountLevel: z.number().min(1).default(1),
  IsActive: z.boolean().default(true),
});

type AccountTypeFormValues = z.infer<typeof accountTypeSchema>;

const AccountTypeForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [parentAccountTypes, setParentAccountTypes] = useState<AccountType[]>([]);

  // Initialize form
  const form = useForm<AccountTypeFormValues>({
    resolver: zodResolver(accountTypeSchema),
    defaultValues: {
      AccountTypeCode: "",
      AccountTypeName: "",
      ParentAccountTypeID: "",
      AccountLevel: 1,
      IsActive: true,
    },
  });

  // Initialize and fetch reference data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch account types for parent dropdown
        const typesData = await accountService.getAllAccountTypes();
        setParentAccountTypes(typesData);

        // If editing, fetch the account type data
        if (isEdit && id) {
          // In a real app, fetch account type by ID
          // For now, mock the data
          const mockAccountType: AccountType = {
            AccountTypeID: parseInt(id),
            AccountTypeCode: "AT" + id,
            AccountTypeName: "Account Type " + id,
            ParentAccountTypeID: undefined,
            AccountLevel: 1,
            IsActive: true,
          };

          setAccountType(mockAccountType);

          // Set form values
          form.reset({
            AccountTypeCode: mockAccountType.AccountTypeCode,
            AccountTypeName: mockAccountType.AccountTypeName,
            ParentAccountTypeID: mockAccountType.ParentAccountTypeID?.toString() || "",
            AccountLevel: mockAccountType.AccountLevel,
            IsActive: mockAccountType.IsActive !== undefined ? mockAccountType.IsActive : true,
          });
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error("Error loading form data");
      } finally {
        setInitialLoading(false);
      }
    };

    initializeForm();
  }, [id, isEdit, form]);

  // Handle parent account type change - update account level based on parent
  const handleParentTypeChange = (value: string) => {
    form.setValue("ParentAccountTypeID", value);

    if (value) {
      const parentType = parentAccountTypes.find((pt) => pt.AccountTypeID.toString() === value);
      if (parentType) {
        form.setValue("AccountLevel", (parentType.AccountLevel || 0) + 1);
      }
    } else {
      form.setValue("AccountLevel", 1);
    }
  };

  // Submit handler for the form
  const onSubmit = async (data: AccountTypeFormValues) => {
    setLoading(true);

    try {
      // Prepare account type data
      const accountTypeData: Partial<AccountType> = {
        AccountTypeCode: data.AccountTypeCode,
        AccountTypeName: data.AccountTypeName,
        ParentAccountTypeID: data.ParentAccountTypeID ? parseInt(data.ParentAccountTypeID) : undefined,
        AccountLevel: data.AccountLevel,
        IsActive: data.IsActive,
      };

      if (isEdit && accountType) {
        // Update existing account type
        const result = await accountService.updateAccountType({
          ...accountTypeData,
          AccountTypeID: accountType.AccountTypeID,
        });

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/account-types");
        } else {
          toast.error(result.Message);
        }
      } else {
        // Create new account type
        const result = await accountService.createAccountType(accountTypeData);

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/account-types");
        } else {
          toast.error(result.Message);
        }
      }
    } catch (error) {
      console.error("Error saving account type:", error);
      toast.error("Failed to save account type");
    } finally {
      setLoading(false);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    navigate("/account-types");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/account-types")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Account Type" : "Create Account Type"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Account Type" : "Create New Account Type"}</CardTitle>
                <CardDescription>{isEdit ? "Update account type information" : "Enter the details for the new account type"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField form={form} name="AccountTypeCode" label="Account Type Code" placeholder="Enter account type code" required />
                  <FormField form={form} name="AccountTypeName" label="Account Type Name" placeholder="Enter account type name" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="ParentAccountTypeID"
                    label="Parent Account Type"
                    type="select"
                    options={parentAccountTypes.map((type) => ({
                      label: type.AccountTypeName,
                      value: type.AccountTypeID.toString(),
                    }))}
                    placeholder="Select parent account type (optional)"
                    onChange={handleParentTypeChange}
                  />
                  <FormField form={form} name="AccountLevel" label="Account Level" type="number" min={1} readOnly={!!form.watch("ParentAccountTypeID")} required />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Account Type Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch id="is-active" checked={form.watch("IsActive")} onCheckedChange={(checked) => form.setValue("IsActive", checked)} />
                    <Label htmlFor="is-active" className="cursor-pointer">
                      {form.watch("IsActive") ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-6">
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
                      Save Account Type
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

export default AccountTypeForm;
