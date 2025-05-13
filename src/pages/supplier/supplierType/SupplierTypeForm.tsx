// src/pages/supplier/supplierType/SupplierTypeForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { supplierService } from "@/services/supplierService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SupplierType } from "@/types/supplierTypes";

// Create the schema for supplier type form validation
const supplierTypeSchema = z.object({
  SupplierTypeCode: z
    .string()
    .min(1, "Code is required")
    .max(20, "Code cannot exceed 20 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, hyphens, and underscores"),
  SupplierTypeName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  SupplierTypeDescription: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  IsActive: z.boolean().default(true),
});

type SupplierTypeFormValues = z.infer<typeof supplierTypeSchema>;

const SupplierTypeForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new" && id !== undefined;
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [supplierType, setSupplierType] = useState<SupplierType | null>(null);

  // Initialize form
  const form = useForm<SupplierTypeFormValues>({
    resolver: zodResolver(supplierTypeSchema),
    defaultValues: {
      SupplierTypeCode: "",
      SupplierTypeName: "",
      SupplierTypeDescription: "",
      IsActive: true,
    },
  });

  // Effect to load supplier type data for editing
  useEffect(() => {
    const loadSupplierType = async () => {
      if (!isEdit || !id) return;

      try {
        setInitialLoading(true);
        // Note: The service doesn't have getSupplierTypeById method yet
        // This is a placeholder for when the method is implemented
        toast.error("Edit functionality requires getSupplierTypeById method in the service");

        // Code that would be used when the method is available:
        // const data = await supplierService.getSupplierTypeById(parseInt(id));
        // if (data) {
        //   setSupplierType(data);
        //   form.reset({
        //     SupplierTypeCode: data.SupplierTypeCode,
        //     SupplierTypeName: data.SupplierTypeName,
        //     SupplierTypeDescription: data.SupplierTypeDescription || "",
        //     IsActive: data.IsActive,
        //   });
        // } else {
        //   toast.error("Supplier type not found");
        //   navigate("/supplier-types");
        // }
      } catch (error) {
        console.error("Error loading supplier type:", error);
        toast.error("Error loading supplier type data");
      } finally {
        setInitialLoading(false);
      }
    };

    loadSupplierType();
  }, [id, isEdit, navigate, form]);

  // Submit handler
  const onSubmit = async (data: SupplierTypeFormValues) => {
    setLoading(true);

    try {
      if (isEdit && supplierType) {
        // Update existing supplier type
        // Note: The service doesn't have updateSupplierType method yet
        toast.error("Update functionality requires updateSupplierType method in the service");

        // Code that would be used when the method is available:
        // const result = await supplierService.updateSupplierType({
        //   SupplierTypeID: supplierType.SupplierTypeID,
        //   ...data,
        // });
        //
        // if (result.Status === 1) {
        //   toast.success(result.Message);
        //   navigate("/supplier-types");
        // } else {
        //   toast.error(result.Message);
        // }
      } else {
        // Create new supplier type
        const result = await supplierService.createSupplierType(data);

        if (result.Status === 1) {
          toast.success(result.Message);
          navigate("/supplier-types");
        } else {
          toast.error(result.Message);
        }
      }
    } catch (error) {
      console.error("Error saving supplier type:", error);
      toast.error("Failed to save supplier type");
    } finally {
      setLoading(false);
    }
  };

  // Cancel button handler
  const handleCancel = () => {
    navigate("/supplier-types");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/supplier-types")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Supplier Type" : "Create Supplier Type"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{isEdit ? "Edit Supplier Type" : "Create New Supplier Type"}</CardTitle>
              <CardDescription>{isEdit ? "Update the supplier type information" : "Enter the details for the new supplier type"}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="SupplierTypeCode"
                  label="Supplier Type Code"
                  placeholder="e.g., MATERIAL, SERVICE"
                  required
                  description="Use uppercase letters, numbers, hyphens, and underscores only"
                />
                <FormField form={form} name="SupplierTypeName" label="Supplier Type Name" placeholder="e.g., Material Suppliers, Service Providers" required />
              </div>

              <FormField form={form} name="SupplierTypeDescription" label="Description" type="textarea" placeholder="Enter a detailed description of this supplier type..." />

              <div className="space-y-4">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="is-active" checked={form.watch("IsActive")} onCheckedChange={(checked) => form.setValue("IsActive", checked)} />
                  <Label htmlFor="is-active" className="cursor-pointer">
                    {form.watch("IsActive") ? "Active" : "Inactive"}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">Inactive supplier types will not be available for selection when creating new suppliers.</p>
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
                    Save Supplier Type
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

export default SupplierTypeForm;
