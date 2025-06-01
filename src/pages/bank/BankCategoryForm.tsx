import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { bankCategoryService } from "@/services/bankService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { BankCategory } from "@/types/bankTypes";

// Create the schema for bank category form validation
const bankCategorySchema = z.object({
  CategoryName: z.string().min(1, "Category name is required").max(250, "Category name must be 250 characters or less"),
  Description: z.string().optional(),
  IsActive: z.boolean(),
});

type BankCategoryFormValues = z.infer<typeof bankCategorySchema>;

const BankCategoryForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [category, setCategory] = useState<BankCategory | null>(null);

  // Initialize form
  const form = useForm<BankCategoryFormValues>({
    resolver: zodResolver(bankCategorySchema),
    defaultValues: {
      CategoryName: "",
      Description: "",
      IsActive: true,
    },
  });

  // Initialize and fetch data if editing
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // If editing, fetch the bank category data
        if (isEdit && id) {
          const categoryData = await bankCategoryService.getBankCategoryById(parseInt(id));

          if (categoryData) {
            setCategory(categoryData);

            // Set form values
            form.reset({
              CategoryName: categoryData.CategoryName || "",
              Description: categoryData.Description || "",
              IsActive: categoryData.IsActive,
            });
          } else {
            toast.error("Bank category not found");
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

  // Submit handler for the bank category form
  const onSubmit = async (data: BankCategoryFormValues) => {
    setLoading(true);

    try {
      // Prepare category data
      const categoryData = {
        CategoryName: data.CategoryName.trim(),
        Description: data.Description?.trim() || undefined,
        IsActive: data.IsActive,
      };

      if (isEdit && category) {
        // Update existing category
        const result = await bankCategoryService.updateBankCategory({
          category: { ...categoryData, CategoryID: category.CategoryID },
        });

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/banks");
        } else {
          toast.error(result.Message);
        }
      } else {
        // Create new category
        const result = await bankCategoryService.createBankCategory({
          category: categoryData,
        });

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/banks");
        } else {
          toast.error(result.Message);
        }
      }
    } catch (error) {
      console.error("Error saving bank category:", error);
      toast.error("Failed to save bank category");
    } finally {
      setLoading(false);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    navigate("/banks");
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
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Bank Category" : "Create Bank Category"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{isEdit ? "Edit Bank Category" : "Create New Bank Category"}</CardTitle>
              <CardDescription>{isEdit ? "Update bank category information" : "Enter the details for the new bank category"}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  form={form}
                  name="CategoryName"
                  label="Category Name"
                  placeholder="Enter category name (e.g., Commercial Banks, Investment Banks)"
                  required
                  description="Unique name for the bank category"
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <FormField
                  form={form}
                  name="Description"
                  label="Description"
                  type="textarea"
                  placeholder="Enter a description for this category"
                  description="Optional description explaining the purpose of this category"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField form={form} name="IsActive" label="Status" type="switch" description="Set to active to enable this category for use" />
              </div>

              {/* Category Information */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Bank Category Usage</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Categories help organize banks by type or function</p>
                  <p>• Examples: Commercial Banks, Investment Banks, Central Banks</p>
                  <p>• Categories can be used for reporting and filtering</p>
                  <p>• Inactive categories won't appear in dropdowns but preserve data</p>
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
                    Save Category
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

export default BankCategoryForm;
