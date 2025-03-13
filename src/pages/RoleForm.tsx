import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { roleService, Role } from "@/services/roleService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";

const formSchema = z.object({
  RoleName: z.string().min(2, "Role name must be at least 2 characters").max(250, "Role name cannot exceed 250 characters"),
});

type FormValues = z.infer<typeof formSchema>;

const RoleForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [role, setRole] = useState<Role | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      RoleName: "",
    },
  });

  useEffect(() => {
    const fetchRole = async () => {
      if (isEdit && id) {
        try {
          const roleData = await roleService.getRoleById(parseInt(id));
          if (roleData) {
            setRole(roleData);
            form.reset({
              RoleName: roleData.RoleName,
            });
          } else {
            toast.error("Role not found");
            navigate("/roles");
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          toast.error("Error loading role");
          navigate("/roles");
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    fetchRole();
  }, [id, isEdit, navigate, form]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      let success;

      if (isEdit && role) {
        success = await roleService.updateRole({
          RoleID: role.RoleID,
          ...data,
        });
      } else {
        success = await roleService.createRole(data);
      }

      if (success) {
        navigate("/roles");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/roles");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/roles")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Role" : "Create Role"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Role" : "Create New Role"}</CardTitle>
          <CardDescription>{isEdit ? "Update the role details" : "Enter the details for the new role"}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField form={form} name="RoleName" label="Role Name" placeholder="Enter role name" required />
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
                    Save Role
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

export default RoleForm;
