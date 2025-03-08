
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { userService, User } from '@/services/userService';
import { FormField } from '@/components/forms/FormField';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { roleService, Role } from '@/services/roleService';

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

const formSchema = z.object({
  userName: z.string().min(3, 'Username must be at least 3 characters').max(250, 'Username cannot exceed 250 characters'),
  userFullName: z.string().min(2, 'Full name must be at least 2 characters').max(250, 'Full name cannot exceed 250 characters'),
  userPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
  emailID: z.string().email('Invalid email address').max(100, 'Email cannot exceed 100 characters'),
  phoneNo: z.string().optional(),
  compID: z.string().min(1, 'Company is required'),
  departmentID: z.string().optional(),
  roleID: z.string().min(1, 'Role is required'),
  isActive: z.boolean().default(true),
}).refine(data => {
  // If creating a new user or changing password
  if (data.userPassword) {
    return data.userPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const UserForm = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedRoleId = searchParams.get('roleId');
  
  const isEdit = id !== 'new';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: '',
      userFullName: '',
      userPassword: '',
      confirmPassword: '',
      emailID: '',
      phoneNo: '',
      compID: '',
      departmentID: '',
      roleID: preselectedRoleId || '',
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch roles
        const rolesData = await roleService.getAllRoles();
        setRoles(rolesData);
        
        // TODO: Fetch departments
        setDepartments([
          { departmentID: 1, departmentName: 'IT' },
          { departmentID: 2, departmentName: 'HR' },
          { departmentID: 3, departmentName: 'Finance' },
          { departmentID: 4, departmentName: 'Operations' },
        ]);
        
        // TODO: Fetch companies
        setCompanies([
          { companyID: 1, companyName: 'Main Company' },
          { companyID: 2, companyName: 'Subsidiary A' },
          { companyID: 3, companyName: 'Subsidiary B' },
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load form data');
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (isEdit && id) {
        try {
          const userData = await userService.getUserById(parseInt(id));
          if (userData) {
            setUser(userData);
            form.reset({
              userName: userData.userName,
              userFullName: userData.userFullName,
              emailID: userData.emailID,
              phoneNo: userData.phoneNo || '',
              compID: userData.compID?.toString() || '',
              departmentID: userData.departmentID?.toString() || '',
              roleID: userData.roleID?.toString() || '',
              isActive: userData.isActive,
              userPassword: '',
              confirmPassword: '',
            });
          } else {
            toast.error('User not found');
            navigate('/users');
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          toast.error('Error loading user');
          navigate('/users');
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    fetchUser();
  }, [id, isEdit, navigate, form]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      let success;
      
      const userData = {
        userName: data.userName,
        userFullName: data.userFullName,
        emailID: data.emailID,
        phoneNo: data.phoneNo,
        compID: data.compID ? parseInt(data.compID) : undefined,
        departmentID: data.departmentID ? parseInt(data.departmentID) : undefined,
        roleID: data.roleID ? parseInt(data.roleID) : undefined,
        isActive: data.isActive,
        userPassword: data.userPassword && data.userPassword.trim() !== '' ? data.userPassword : undefined,
      };
      
      if (isEdit && user) {
        success = await userService.updateUser({
          ...userData,
          userID: user.userID,
        });
      } else {
        if (!userData.userPassword) {
          toast.error('Password is required for new users');
          setLoading(false);
          return;
        }
        success = await userService.createUser(userData);
      }
      
      if (success) {
        navigate('/users');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/users');
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
        <Button variant="outline" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? 'Edit User' : 'Create User'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit User' : 'Create New User'}</CardTitle>
          <CardDescription>
            {isEdit ? 'Update the user details' : 'Enter the details for the new user'}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="userName"
                  label="Username"
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                />
                <FormField
                  form={form}
                  name="userFullName"
                  label="Full Name"
                  placeholder="Enter full name"
                  required
                />
                <FormField
                  form={form}
                  name="emailID"
                  label="Email"
                  placeholder="Enter email address"
                  type="email"
                  autoComplete="email"
                  required
                />
                <FormField
                  form={form}
                  name="phoneNo"
                  label="Phone Number"
                  placeholder="Enter phone number"
                  autoComplete="tel"
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="compID"
                  label="Company"
                  type="select"
                  options={companies.map(company => ({
                    label: company.companyName,
                    value: company.companyID.toString()
                  }))}
                  placeholder="Select company"
                  required
                />
                <FormField
                  form={form}
                  name="departmentID"
                  label="Department"
                  type="select"
                  options={departments.map(dept => ({
                    label: dept.departmentName,
                    value: dept.departmentID.toString()
                  }))}
                  placeholder="Select department"
                />
                <FormField
                  form={form}
                  name="roleID"
                  label="Role"
                  type="select"
                  options={roles.map(role => ({
                    label: role.roleName,
                    value: role.roleID.toString()
                  }))}
                  placeholder="Select role"
                  required
                />
                <FormField
                  form={form}
                  name="isActive"
                  label="Active Status"
                  render={({ field }) => (
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <label
                          htmlFor="activeStatus"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Active Status
                        </label>
                        <p className="text-sm text-muted-foreground">
                          User will {!field.value && "not"} be able to login
                        </p>
                      </div>
                      <Switch
                        id="activeStatus"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="userPassword"
                  label={isEdit ? "New Password (leave blank to keep current)" : "Password"}
                  placeholder={isEdit ? "Enter new password" : "Enter password"}
                  type="password"
                  autoComplete={isEdit ? "new-password" : "new-password"}
                  required={!isEdit}
                />
                <FormField
                  form={form}
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  required={!isEdit}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
              >
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
