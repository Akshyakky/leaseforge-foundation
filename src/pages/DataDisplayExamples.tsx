
import React, { useState } from 'react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/data-display/DataTable';
import { DashboardCard } from '@/components/data-display/DashboardCard';
import { DataList } from '@/components/data-display/DataList';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Edit, Trash2, User, Users, DollarSign, FileText, BarChart3, Calendar } from 'lucide-react';

// Sample data for the table
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', lastLogin: '2023-05-20' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active', lastLogin: '2023-05-19' },
  { id: 3, name: 'Robert Johnson', email: 'robert@example.com', role: 'Manager', status: 'Inactive', lastLogin: '2023-05-15' },
  { id: 4, name: 'Emily Davis', email: 'emily@example.com', role: 'User', status: 'Active', lastLogin: '2023-05-18' },
  { id: 5, name: 'Michael Wilson', email: 'michael@example.com', role: 'User', status: 'Active', lastLogin: '2023-05-17' },
];

// Form schema using zod
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Must be a valid email address"),
  role: z.string(),
  status: z.enum(["Active", "Inactive"]),
});

type User = typeof users[0];
type UserFormValues = z.infer<typeof userSchema>;

const DataDisplayExamples = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  
  // Simulate loading for demo purposes
  const simulateLoading = () => {
    setDataLoading(true);
    setTimeout(() => {
      setDataLoading(false);
    }, 1500);
  };
  
  // Handle form submission
  const handleSubmit = async (data: UserFormValues) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Form submitted:", data);
    toast.success("User updated successfully");
    setLoading(false);
  };
  
  // Table columns definition
  const columns = [
    {
      header: "Name",
      accessorKey: "name" as keyof User,
      enableSorting: true,
    },
    {
      header: "Email",
      accessorKey: "email" as keyof User,
      enableSorting: true,
    },
    {
      header: "Role",
      accessorKey: "role" as keyof User,
      enableSorting: true,
    },
    {
      header: "Status",
      accessorKey: "status" as keyof User,
      cell: ({ row }: { row: User }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.status}
        </span>
      ),
      enableSorting: true,
    },
    {
      header: "Last Login",
      accessorKey: "lastLogin" as keyof User,
      enableSorting: true,
    },
  ];
  
  // Row actions for the table
  const rowActions = [
    {
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      onClick: (row: User) => {
        toast.info(`Editing user: ${row.name}`);
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: (row: User) => {
        toast.error(`Delete user: ${row.name}`);
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Data Display Examples</h1>
        <p className="text-muted-foreground mb-8">
          Examples of data display components with various features.
        </p>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="table">Data Table</TabsTrigger>
          <TabsTrigger value="cards">Dashboard Cards</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Table with Sorting, Filtering & Actions</CardTitle>
              <CardDescription>
                A flexible data table component with built-in sorting, filtering, and row actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button 
                  onClick={simulateLoading}
                  disabled={dataLoading}
                >
                  Simulate Loading
                </Button>
              </div>
              <DataTable
                data={users}
                columns={columns}
                isLoading={dataLoading}
                rowActions={rowActions}
                onRowClick={(row) => toast.info(`Selected: ${row.name}`)}
                pagination={{
                  pageSize: 3,
                  pageIndex,
                  pageCount: Math.ceil(users.length / 3),
                  onPageChange: setPageIndex,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data List Component</CardTitle>
              <CardDescription>
                A simple list component for displaying data with actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button 
                  onClick={simulateLoading}
                  disabled={dataLoading}
                >
                  Simulate Loading
                </Button>
              </div>
              <DataList
                title="Users"
                items={users.map(user => ({
                  id: user.id,
                  title: user.name,
                  description: user.email,
                  icon: <div className="bg-primary/10 p-2 rounded-full"><User className="h-5 w-5" /></div>,
                  rightContent: <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>{user.status}</span>
                }))}
                isLoading={dataLoading}
                onItemClick={(item) => toast.info(`Selected: ${item.title}`)}
                itemActions={[
                  {
                    label: "Edit",
                    icon: <Edit className="h-4 w-4" />,
                    onClick: (item) => toast.info(`Editing: ${item.title}`)
                  },
                  {
                    label: "Delete",
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: (item) => toast.error(`Deleting: ${item.title}`)
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard
              title="Total Users"
              subtitle="All users"
              icon={<Users className="h-4 w-4" />}
              value="1,248"
              trend={{ value: 12.5, label: "from last month", positive: true }}
              loading={dataLoading}
            />
            
            <DashboardCard
              title="Revenue"
              subtitle="Current month"
              icon={<DollarSign className="h-4 w-4" />}
              value="$34,567"
              trend={{ value: 4.3, label: "from last month", positive: true }}
              loading={dataLoading}
              variant="primary"
            />
            
            <DashboardCard
              title="Pending Orders"
              subtitle="Requires attention"
              icon={<FileText className="h-4 w-4" />}
              value="12"
              trend={{ value: 8.4, label: "from last week", positive: false }}
              loading={dataLoading}
              variant="destructive"
            />
            
            <DashboardCard
              title="Upcoming Events"
              subtitle="Next 7 days"
              icon={<Calendar className="h-4 w-4" />}
              value="8"
              loading={dataLoading}
              variant="secondary"
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Custom Card Content</CardTitle>
              <CardDescription>Cards can contain any content</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardCard
                title="Monthly Performance"
                icon={<BarChart3 className="h-4 w-4" />}
                loading={dataLoading}
              >
                <div className="mt-4 h-[200px] flex items-center justify-center bg-muted/30 rounded-md">
                  <p className="text-muted-foreground">Chart visualization would go here</p>
                </div>
              </DashboardCard>
            </CardContent>
          </Card>
          
          <div className="flex justify-center">
            <Button 
              onClick={simulateLoading}
              disabled={dataLoading}
            >
              Simulate Loading
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form with Validation</CardTitle>
              <CardDescription>Form builder with schema validation and error handling</CardDescription>
            </CardHeader>
            <CardContent>
              <FormBuilder<UserFormValues>
                fields={[
                  {
                    name: "name",
                    label: "Full Name",
                    placeholder: "Enter your full name",
                    defaultValue: "John Doe",
                  },
                  {
                    name: "email",
                    label: "Email Address",
                    placeholder: "your.email@example.com",
                    type: "email",
                    defaultValue: "john@example.com",
                  },
                  {
                    name: "role",
                    label: "Role",
                    defaultValue: "User",
                    render: ({ field }) => (
                      <Input {...field} />
                    ),
                  },
                  {
                    name: "status",
                    label: "Status",
                    defaultValue: "Active",
                    render: ({ field }) => (
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            {...field}
                            value="Active"
                            checked={field.value === "Active"}
                            className="h-4 w-4"
                          />
                          <span>Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            {...field}
                            value="Inactive"
                            checked={field.value === "Inactive"}
                            className="h-4 w-4"
                          />
                          <span>Inactive</span>
                        </label>
                      </div>
                    ),
                  },
                ]}
                schema={userSchema}
                onSubmit={handleSubmit}
                isLoading={loading}
                successMessage="User information updated successfully"
                errorMessage="Failed to update user information"
                submitText="Update User"
                cancelText="Cancel"
                onCancel={() => toast.info("Form cancelled")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataDisplayExamples;
