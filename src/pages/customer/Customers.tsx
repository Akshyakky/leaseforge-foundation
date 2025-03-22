import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, UserPlus, ChevronDown, FileText, Phone, Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { customerService } from "@/services/customerService";
import { Customer, CustomerType } from "@/types/customerTypes";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Customers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");

  // Fetch customers and types on component mount
  useEffect(() => {
    fetchCustomers();
    fetchCustomerTypes();
  }, []);

  // Fetch all customers
  const fetchCustomers = async (search?: string, typeId?: string) => {
    try {
      setLoading(true);
      let customersData: Customer[];

      if (search || typeId) {
        // If search term or type filter is provided, use search endpoint
        customersData = await customerService.searchCustomers(search || "", {
          typeId: typeId ? parseInt(typeId) : undefined,
        });
      } else {
        // Otherwise fetch all customers
        customersData = await customerService.getAllCustomers();
      }

      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer types for filtering
  const fetchCustomerTypes = async () => {
    try {
      const types = await customerService.getCustomerTypes();
      setCustomerTypes(types);
    } catch (error) {
      console.error("Error fetching customer types:", error);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchCustomers(value, selectedTypeId);
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle customer type filter change
  const handleTypeChange = (value: string) => {
    setSelectedTypeId(value);
    fetchCustomers(searchTerm, value);
  };

  // Navigation handlers
  const handleAddCustomer = () => {
    navigate("/customers/new");
  };

  const handleEditCustomer = (customerId: number) => {
    navigate(`/customers/edit/${customerId}`);
  };

  const handleViewCustomer = (customerId: number) => {
    navigate(`/customers/${customerId}`);
  };

  // Delete confirmation handlers
  const openDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCustomer(null);
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const result = await customerService.deleteCustomer(selectedCustomer.CustomerID);

      if (result.success) {
        setCustomers(customers.filter((c) => c.CustomerID !== selectedCustomer.CustomerID));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    } finally {
      closeDeleteDialog();
    }
  };

  // Render customer type badge
  const renderCustomerType = (typeId?: number) => {
    if (!typeId) return <span className="text-muted-foreground">Not specified</span>;

    const type = customerTypes.find((t) => t.TypeID === typeId);
    if (!type) return <span className="text-muted-foreground">Unknown</span>;

    // Use different badge colors based on customer type
    let badgeClass = "";
    if (type.Description === "Individual") badgeClass = "bg-blue-50 text-blue-700";
    else if (type.Description === "Corporate") badgeClass = "bg-purple-50 text-purple-700";
    else if (type.Description === "Government") badgeClass = "bg-amber-50 text-amber-700";
    else badgeClass = "bg-emerald-50 text-emerald-700";

    return (
      <Badge variant="outline" className={badgeClass}>
        {type.Description}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Button onClick={handleAddCustomer}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>Manage customer accounts and related information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search customers..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedTypeId} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Types</SelectItem>
                  {customerTypes.map((type) => (
                    <SelectItem key={type.TypeID} value={type.TypeID.toString()}>
                      {type.Description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{searchTerm || selectedTypeId ? "No customers found matching your criteria." : "No customers found."}</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.CustomerID}>
                      <TableCell>
                        <div className="font-medium">{customer.CustomerFullName}</div>
                        <div className="text-sm text-muted-foreground">{customer.CustomerNo || "No customer number"}</div>
                      </TableCell>
                      <TableCell>{renderCustomerType(customer.TypeID)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {customer.Address && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[200px]">{customer.Address}</span>
                            </div>
                          )}
                          {customer.TaxRegNo && (
                            <div className="flex items-center text-sm">
                              <FileText className="h-3 w-3 mr-1" />
                              <span>Tax: {customer.TaxRegNo}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.CountryName || customer.CityName ? (
                          <div className="flex flex-col">
                            {customer.CityName && <span>{customer.CityName}</span>}
                            {customer.CountryName && <span className="text-muted-foreground text-sm">{customer.CountryName}</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>{customer.CustomerIdentityNo || <span className="text-muted-foreground">Not available</span>}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCustomer(customer.CustomerID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCustomer(customer.CustomerID)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(customer)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        description={
          selectedCustomer
            ? `Are you sure you want to delete the customer "${selectedCustomer.CustomerFullName}"? This will also delete all associated contacts and attachments. This action cannot be undone.`
            : "Are you sure you want to delete this customer?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Customers;
