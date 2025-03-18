import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { departmentService, Department } from "@/services/departmentService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";

const formSchema = z.object({
  DepartmentName: z.string().min(2, "Department name must be at least 2 characters").max(250, "Department name cannot exceed 250 characters"),
});

type FormValues = z.infer<typeof formSchema>;

const DepartmentForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [department, setDepartment] = useState<Department | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      DepartmentName: "",
    },
  });

  useEffect(() => {
    const fetchDepartment = async () => {
      if (isEdit && id) {
        try {
          const departmentData = await departmentService.getDepartmentById(parseInt(id));
          if (departmentData) {
            setDepartment(departmentData);
            form.reset({
              DepartmentName: departmentData.DepartmentName,
            });
          } else {
            toast.error("Department not found");
            navigate("/departments");
          }
        } catch (error) {
          console.error("Error fetching department:", error);
          toast.error("Error loading department");
          navigate("/departments");
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    fetchDepartment();
  }, [id, isEdit, navigate, form]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      let success;

      if (isEdit && department) {
        success = await departmentService.updateDepartment({
          DepartmentID: department.DepartmentID,
          ...data,
        });
      } else {
        success = await departmentService.createDepartment(data);
      }

      if (success) {
        navigate("/departments");
      }
    } catch (error) {
      console.error("Error saving department:", error);
      toast.error("Failed to save department");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/departments");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/departments")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Department" : "Create Department"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Department" : "Create New Department"}</CardTitle>
          <CardDescription>{isEdit ? "Update the department details" : "Enter the details for the new department"}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField form={form} name="DepartmentName" label="Department Name" placeholder="Enter department name" required />
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
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
                    Save Department
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default DepartmentForm;
