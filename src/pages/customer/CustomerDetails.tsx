import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { customerService } from "@/services/customerService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, UserRound, Building, Home, Phone, Mail, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";

export const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const data = await customerService.getCustomerById(parseInt(id));
        setCustomer(data);
      } catch (err) {
        console.error("Error fetching customer:", err);
        setError("Failed to load customer details");
        toast.error("Failed to load customer details");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  const handleDelete = async () => {
    if (!customer) return;

    try {
      const success = await customerService.deleteCustomer(customer.CustomerID);
      if (success) {
        toast.success("Customer deleted successfully");
        navigate("/customers");
      }
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error("Failed to delete customer");
    }
  };

  if (loading) {
    return (
      <div className="container p-4">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded-md w-3/4 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded-md w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Customer not found"}</p>
            <Button onClick={() => navigate("/customers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Customer Details</CardTitle>
            <CardDescription>View and manage customer information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/customers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/customers/edit/${customer.CustomerID}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex items-center justify-center md:justify-start">
              <Avatar className="h-24 w-24">
                {customer.CustomerImage ? (
                  <AvatarImage src={customer.CustomerImage} />
                ) : (
                  <AvatarFallback className="text-xl">
                    {customer.CustomerType === "Individual" ? <UserRound className="h-12 w-12" /> : <Building className="h-12 w-12" />}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold">{customer.CustomerName}</h2>
                <Badge variant={customer.CustomerType === "Individual" ? "default" : "secondary"}>{customer.CustomerType}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.Email || "No email provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.ContactNo || "No phone number provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.Address || "No address provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>Customer since: {formatDate(customer.CreatedOn)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Basic Details</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Customer ID:</span>
                      <span>{customer.CustomerID}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Customer Name:</span>
                      <span>{customer.CustomerName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Customer Type:</span>
                      <span>{customer.CustomerType}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Email:</span>
                      <span>{customer.Email || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Contact No:</span>
                      <span>{customer.ContactNo || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Company:</span>
                      <span>{customer.CompanyName || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Audit Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                      <span>{customer.CreatedBy || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                      <span>{formatDate(customer.CreatedOn)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Last Updated By:</span>
                      <span>{customer.UpdatedBy || "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Last Updated On:</span>
                      <span>{customer.UpdatedOn ? formatDate(customer.UpdatedOn) : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {customer.Remarks && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Remarks</h3>
                  <p className="p-4 bg-gray-50 rounded-md">{customer.Remarks}</p>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Address Information</h3>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p>{customer.Address || "No address information provided"}</p>
                  {customer.City && (
                    <div className="mt-2">
                      <span className="font-medium">City:</span> {customer.City}
                    </div>
                  )}
                  {customer.Country && (
                    <div>
                      <span className="font-medium">Country:</span> {customer.Country}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="contracts" className="mt-6">
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
                <p className="text-muted-foreground mb-4">This section will display contracts associated with this customer.</p>
                <p className="text-sm text-muted-foreground">Coming soon...</p>
              </div>
            </TabsContent>
            <TabsContent value="documents" className="mt-6">
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
                <p className="text-muted-foreground mb-4">This section will display documents associated with this customer.</p>
                <p className="text-sm text-muted-foreground">Coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customer.CustomerName}? This action cannot be undone and will remove all data associated with this customer.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default CustomerDetails;
