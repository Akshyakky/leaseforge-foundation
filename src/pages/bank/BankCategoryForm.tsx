import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { bankCategoryService } from "@/services/bankService";
import { toast } from "sonner";
import { BankCategory } from "@/types/bankTypes";

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

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [category, setCategory] = useState<BankCategory | null>(null);

  const form = useForm<BankCategoryFormValues>({
    resolver: zodResolver(bankCategorySchema),
    defaultValues: {
      CategoryName: "",
      Description: "",
      IsActive: true,
    },
  });

  useEffect(() => {
    const initializeForm = async () => {
      try {
        if (isEdit && id) {
          const categoryData = await bankCategoryService.getBankCategoryById(parseInt(id));

          if (categoryData) {
            setCategory(categoryData);
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

  const onSubmit = async (data: BankCategoryFormValues) => {
    setLoading(true);

    try {
      const categoryData = {
        CategoryName: data.CategoryName.trim(),
        Description: data.Description?.trim() || undefined,
        IsActive: data.IsActive,
      };

      if (isEdit && category) {
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
                  control={form.control}
                  name="CategoryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category name (e.g., Commercial Banks, Investment Banks)" {...field} />
                      </FormControl>
                      <FormDescription>Unique name for the bank category</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="Description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter a description for this category" {...field} />
                      </FormControl>
                      <FormDescription>Optional description explaining the purpose of this category</FormDescription>
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
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <FormDescription>Toggle to activate or deactivate this category</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Bank Category Usage</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Categories help organize banks by type or function</p>
                  <p>Examples: Commercial Banks, Investment Banks, Central Banks</p>
                  <p>Categories can be used for reporting and filtering</p>
                  <p>Inactive categories will not appear in dropdown selections but preserve existing data</p>
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
