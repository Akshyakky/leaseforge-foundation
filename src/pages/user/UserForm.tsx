import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { userService, User, UserCompany } from "@/services/userService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { roleService, Role } from "@/services/roleService";
import { departmentService } from "@/services/departmentService";
import { companyService } from "@/services/companyService";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Interface for department
interface Department {
  departmentID: number;
  departmentName: string;
}

// Interface for company
interface Company {
  companyID: number;
  companyName: string;
}

const formSchema = z
  .object({
    UserName: z.string().min(3, "Username must be at least 3 characters").max(250, "Username cannot exceed 250 characters"),
    UserFullName: z.string().min(2, "Full name must be at least 2 characters").max(250, "Full name cannot exceed 250 characters"),
    UserPassword: z.string().optional(),
    ConfirmPassword: z.string().optional(),
    EmailID: z.string().email("Invalid email address").max(100, "Email cannot exceed 100 characters"),
    PhoneNo: z.string().optional(),
    DepartmentID: z.string().optional(),
    RoleID: z.string().min(1, "Role is required"),
    IsActive: z.boolean().default(true),
    // We will handle company selection separately
  })
  .refine(
    (data) => {
      // If creating a new user or changing password
      if (data.UserPassword) {
        return data.UserPassword === data.ConfirmPassword;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ["ConfirmPassword"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

const UserForm = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedRoleId = searchParams.get("roleId");
  const preselectedCompanyId = searchParams.get("companyId");

  const isEdit = id !== "new";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // State to manage selected companies
  const [selectedCompanies, setSelectedCompanies] = useState<UserCompany[]>([]);
  const [defaultCompanyId, setDefaultCompanyId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      UserName: "",
      UserFullName: "",
      UserPassword: "",
      ConfirmPassword: "",
      EmailID: "",
      PhoneNo: "",
      DepartmentID: "",
      RoleID: preselectedRoleId || "",
      IsActive: true,
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch roles
        const rolesData = await roleService.getAllRoles();
        setRoles(rolesData);

        const departmentsData = await departmentService.getAllDepartments();
        setDepartments(
          departmentsData.map((dept) => ({
            departmentID: dept.DepartmentID,
            departmentName: dept.DepartmentName,
          }))
        );

        // Fetch companies from the API
        const companiesData = await companyService.getCompaniesForDropdown(true);
        setCompanies(
          companiesData.map((company) => ({
            companyID: company.CompanyID,
            companyName: company.CompanyName,
          }))
        );

        // If there's a preselected company, add it to the selected companies
        if (preselectedCompanyId && !isEdit) {
          const companyId = parseInt(preselectedCompanyId);
          const company = companiesData.find((c) => c.CompanyID === companyId);
          if (company) {
            setSelectedCompanies([
              {
                CompanyID: company.CompanyID,
                CompanyName: company.CompanyName,
                IsDefault: true,
              },
            ]);
            setDefaultCompanyId(company.CompanyID);
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load form data");
      }
    };

    fetchInitialData();
  }, [preselectedCompanyId, isEdit]);

  useEffect(() => {
    const fetchUser = async () => {
      if (isEdit && id) {
        try {
          const userData = await userService.getUserById(parseInt(id));

          if (userData.user) {
            setUser(userData.user);
            form.reset({
              UserName: userData.user.UserName,
              UserFullName: userData.user.UserFullName,
              EmailID: userData.user.EmailID,
              PhoneNo: userData.user.PhoneNo || "",
              DepartmentID: userData.user.DepartmentID?.toString() || "",
              RoleID: userData.user.RoleID?.toString() || "",
              IsActive: userData.user.IsActive,
              UserPassword: "",
              ConfirmPassword: "",
            });

            // Set the user's companies
            setSelectedCompanies(userData.companies);

            // Set default company
            const defaultCompany = userData.companies.find((c) => c.IsDefault);
            if (defaultCompany) {
              setDefaultCompanyId(defaultCompany.CompanyID);
            }
          } else {
            toast.error("User not found");
            navigate("/users");
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          toast.error("Error loading user");
          navigate("/users");
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    fetchUser();
  }, [id, isEdit, navigate, form]);

  const handleCompanySelection = (companyId: number, checked: boolean) => {
    if (checked) {
      // Find the company to add
      const companyToAdd = companies.find((c) => c.companyID === companyId);
      if (companyToAdd) {
        // If this is the first company being added, make it default
        const isDefault = selectedCompanies.length === 0 || companyId === defaultCompanyId;

        if (isDefault) {
          setDefaultCompanyId(companyId);
        }

        setSelectedCompanies([
          ...selectedCompanies,
          {
            CompanyID: companyToAdd.companyID,
            CompanyName: companyToAdd.companyName,
            IsDefault: isDefault,
          },
        ]);
      }
    } else {
      // Remove the company
      const updatedCompanies = selectedCompanies.filter((c) => c.CompanyID !== companyId);
      setSelectedCompanies(updatedCompanies);

      // If the default company was removed, set a new default if any companies remain
      if (companyId === defaultCompanyId && updatedCompanies.length > 0) {
        setDefaultCompanyId(updatedCompanies[0].CompanyID);

        // Update the IsDefault flag
        setSelectedCompanies(
          updatedCompanies.map((c) => ({
            ...c,
            IsDefault: c.CompanyID === updatedCompanies[0].CompanyID,
          }))
        );
      } else if (updatedCompanies.length === 0) {
        setDefaultCompanyId(null);
      }
    }
  };

  const handleDefaultCompanyChange = (companyId: number) => {
    setDefaultCompanyId(companyId);

    // Update all companies to reflect the new default
    setSelectedCompanies(
      selectedCompanies.map((company) => ({
        ...company,
        IsDefault: company.CompanyID === companyId,
      }))
    );
  };

  const validateCompanies = () => {
    if (selectedCompanies.length === 0) {
      toast.error("At least one company must be selected");
      return false;
    }

    if (!selectedCompanies.some((c) => c.IsDefault)) {
      toast.error("A default company must be selected");
      return false;
    }

    return true;
  };

  const onSubmit = async (data: FormValues) => {
    // Validate company selection
    if (!validateCompanies()) {
      return;
    }

    setLoading(true);
    try {
      let success;

      const userData = {
        UserName: data.UserName,
        UserFullName: data.UserFullName,
        EmailID: data.EmailID,
        PhoneNo: data.PhoneNo,
        DepartmentID: data.DepartmentID ? parseInt(data.DepartmentID) : undefined,
        RoleID: data.RoleID ? parseInt(data.RoleID) : undefined,
        IsActive: data.IsActive,
        UserPassword: data.UserPassword && data.UserPassword.trim() !== "" ? data.UserPassword : undefined,
      };

      if (isEdit && user) {
        success = await userService.updateUser(
          {
            ...userData,
            UserID: user.UserID,
          },
          selectedCompanies
        );
      } else {
        if (!userData.UserPassword) {
          toast.error("Password is required for new users");
          setLoading(false);
          return;
        }
        success = await userService.createUser(userData, selectedCompanies);
      }

      if (success) {
        navigate("/users");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/users");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit User" : "Create User"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit User" : "Create New User"}</CardTitle>
          <CardDescription>{isEdit ? "Update the user details" : "Enter the details for the new user"}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField form={form} name="UserName" label="Username" placeholder="Enter username" autoComplete="username" required />
                <FormField form={form} name="UserFullName" label="Full Name" placeholder="Enter full name" required />
                <FormField form={form} name="EmailID" label="Email" placeholder="Enter email address" type="email" autoComplete="email" required />
                <FormField form={form} name="PhoneNo" label="Phone Number" placeholder="Enter phone number" autoComplete="tel" />
              </div>

              <Separator />

              {/* Company Selection Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Company Assignment</h3>
                  <p className="text-sm text-muted-foreground">Select the companies this user can access</p>
                </div>

                <div className="border rounded-md p-4">
                  <div className="grid grid-cols-1 gap-4">
                    {companies.map((company) => {
                      const isSelected = selectedCompanies.some((c) => c.CompanyID === company.companyID);
                      return (
                        <div key={company.companyID} className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`company-${company.companyID}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleCompanySelection(company.companyID, checked === true)}
                            />
                            <Label htmlFor={`company-${company.companyID}`}>{company.companyName}</Label>
                          </div>

                          {isSelected && (
                            <div className="ml-6">
                              <RadioGroup value={defaultCompanyId?.toString() || ""} onValueChange={(value) => handleDefaultCompanyChange(parseInt(value))}>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value={company.companyID.toString()} id={`default-${company.companyID}`} />
                                  <Label htmlFor={`default-${company.companyID}`}>Set as default company</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedCompanies.length === 0 && <p className="text-sm text-red-500">At least one company must be selected</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="DepartmentID"
                  label="Department"
                  type="select"
                  options={departments.map((dept) => ({
                    label: dept.departmentName,
                    value: dept.departmentID.toString(),
                  }))}
                  placeholder="Select department"
                />
                <FormField
                  form={form}
                  name="RoleID"
                  label="Role"
                  type="select"
                  options={roles.map((role) => ({
                    label: role.RoleName,
                    value: role.RoleID.toString(),
                  }))}
                  placeholder="Select role"
                  required
                />
                <FormField
                  form={form}
                  name="IsActive"
                  label="Active Status"
                  render={({ field }) => (
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <label htmlFor="activeStatus" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Active Status
                        </label>
                        <p className="text-sm text-muted-foreground">User will {!field.value && "not"} be able to login</p>
                      </div>
                      <Switch id="activeStatus" checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                  )}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="UserPassword"
                  label={isEdit ? "New Password (leave blank to keep current)" : "Password"}
                  placeholder={isEdit ? "Enter new password" : "Enter password"}
                  type="password"
                  autoComplete={isEdit ? "new-password" : "new-password"}
                  required={!isEdit}
                />
                <FormField
                  form={form}
                  name="ConfirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  required={!isEdit}
                />
              </div>
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
                    Save User
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

export default UserForm;
