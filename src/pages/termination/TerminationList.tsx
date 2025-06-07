// src/pages/termination/TerminationList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MoreHorizontal,
  Search,
  Plus,
  FileText,
  Building,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Home,
  User,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { terminationService, ContractTermination } from "@/services/terminationService";
import { customerService } from "@/services/customerService";
import { propertyService } from "@/services/propertyService";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";

const TerminationList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [terminations, setTerminations] = useState<ContractTermination[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTermination, setSelectedTermination] = useState<ContractTermination | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundDate, setRefundDate] = useState<Date | null>(new Date());
  const [refundReference, setRefundReference] = useState("");

  // Filter states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Termination status options
  const terminationStatusOptions = ["Draft", "Pending", "Approved", "Completed", "Cancelled"];

  // Fetch data on component mount
  useEffect(() => {
    fetchTerminations();
    fetchCustomers();
    fetchProperties();
  }, []);

  // Fetch customers for filter dropdown
  const fetchCustomers = async () => {
    try {
      const customersData = await customerService.getAllCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    }
  };

  // Fetch properties for filter dropdown
  const fetchProperties = async () => {
    try {
      const propertiesData = await propertyService.getAllProperties();
      setProperties(propertiesData);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
    }
  };

  // Fetch all terminations with filters
  const fetchTerminations = async (filters?: { searchText?: string; customerID?: number; propertyID?: number; terminationStatus?: string; fromDate?: Date; toDate?: Date }) => {
    try {
      setLoading(true);
      const terminationsData = await terminationService.searchTerminations(filters || {});
      setTerminations(terminationsData);
    } catch (error) {
      console.error("Error fetching terminations:", error);
      toast.error("Failed to load terminations");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      handleFilterChange();
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = () => {
    const filters = {
      searchText: searchTerm || undefined,
      customerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      propertyID: selectedPropertyId ? parseInt(selectedPropertyId) : undefined,
      terminationStatus: selectedStatus || undefined,
      fromDate: dateFrom,
      toDate: dateTo,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    fetchTerminations(filters);
  };

  // Handle filter dropdown changes
  const handleCustomerChange = (value: string) => {
    setSelectedCustomerId(value === "all" ? "" : value);
    setTimeout(handleFilterChange, 100);
  };

  const handlePropertyChange = (value: string) => {
    setSelectedPropertyId(value === "all" ? "" : value);
    setTimeout(handleFilterChange, 100);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value === "all" ? "" : value);
    setTimeout(handleFilterChange, 100);
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    setTimeout(handleFilterChange, 100);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    setTimeout(handleFilterChange, 100);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCustomerId("");
    setSelectedPropertyId("");
    setSelectedStatus("");
    setDateFrom(undefined);
    setDateTo(undefined);
    fetchTerminations();
  };

  // Navigation handlers
  const handleAddTermination = () => {
    navigate("/terminations/new");
  };

  const handleEditTermination = (termination: ContractTermination) => {
    navigate(`/terminations/edit/${termination.TerminationID}`);
  };

  const handleViewTermination = (termination: ContractTermination) => {
    navigate(`/terminations/${termination.TerminationID}`);
  };

  // Delete termination handlers
  const openDeleteDialog = (termination: ContractTermination) => {
    setSelectedTermination(termination);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTermination(null);
  };

  const handleDeleteTermination = async () => {
    if (!selectedTermination) return;

    try {
      const response = await terminationService.deleteTermination(selectedTermination.TerminationID);

      if (response.Status === 1) {
        setTerminations(terminations.filter((t) => t.TerminationID !== selectedTermination.TerminationID));
        toast.success("Termination deleted successfully");
      } else {
        toast.error(response.Message || "Failed to delete termination");
      }
    } catch (error) {
      console.error("Error deleting termination:", error);
      toast.error("Failed to delete termination");
    } finally {
      closeDeleteDialog();
    }
  };

  // Refund processing handlers
  const openRefundDialog = (termination: ContractTermination) => {
    setSelectedTermination(termination);
    setRefundDate(new Date());
    setRefundReference("");
    setIsRefundDialogOpen(true);
  };

  const closeRefundDialog = () => {
    setIsRefundDialogOpen(false);
    setSelectedTermination(null);
  };

  const handleProcessRefund = async () => {
    if (!selectedTermination || !refundDate || !refundReference) {
      toast.error("Please provide refund date and reference");
      return;
    }

    try {
      const response = await terminationService.processRefund(selectedTermination.TerminationID, refundDate, refundReference);

      if (response.Status === 1) {
        setTerminations(
          terminations.map((t) =>
            t.TerminationID === selectedTermination.TerminationID ? { ...t, IsRefundProcessed: true, RefundDate: refundDate, RefundReference: refundReference } : t
          )
        );
        toast.success("Refund processed successfully");
      } else {
        toast.error(response.Message || "Failed to process refund");
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error("Failed to process refund");
    } finally {
      closeRefundDialog();
    }
  };

  // Change termination status
  const handleChangeStatus = async (termination: ContractTermination, newStatus: string) => {
    try {
      const response = await terminationService.changeTerminationStatus(termination.TerminationID, newStatus);

      if (response.Status === 1) {
        setTerminations(terminations.map((t) => (t.TerminationID === termination.TerminationID ? { ...t, TerminationStatus: newStatus } : t)));
        toast.success(`Termination status changed to ${newStatus}`);
      } else {
        toast.error(response.Message || "Failed to change termination status");
      }
    } catch (error) {
      console.error("Error changing termination status:", error);
      toast.error("Failed to change termination status");
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, icon: FileText, className: "bg-gray-100 text-gray-800" },
      Pending: { variant: "default" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Approved: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Completed: { variant: "default" as const, icon: CheckCircle, className: "bg-blue-100 text-blue-800" },
      Cancelled: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate summary statistics
  const stats = {
    total: terminations.length,
    draft: terminations.filter((t) => t.TerminationStatus === "Draft").length,
    pending: terminations.filter((t) => t.TerminationStatus === "Pending").length,
    approved: terminations.filter((t) => t.TerminationStatus === "Approved").length,
    completed: terminations.filter((t) => t.TerminationStatus === "Completed").length,
    cancelled: terminations.filter((t) => t.TerminationStatus === "Cancelled").length,
    totalSecurityDeposit: terminations.reduce((sum, t) => sum + (t.SecurityDepositAmount || 0), 0),
    totalRefunds: terminations.reduce((sum, t) => sum + (t.RefundAmount || 0), 0),
    pendingRefunds: terminations.filter((t) => t.RefundAmount > 0 && !t.IsRefundProcessed).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Contract Termination Management</h1>
          <p className="text-muted-foreground">Manage rental contract terminations and security deposit processing</p>
        </div>
        <Button onClick={handleAddTermination}>
          <Plus className="mr-2 h-4 w-4" />
          New Termination
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Terminations</CardTitle>
          <CardDescription>View and manage all contract terminations</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-9 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-muted-foreground">Draft</span>
                </div>
                <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Approved</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Cancelled</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Total Deposits</span>
                </div>
                <div className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalSecurityDeposit)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Total Refunds</span>
                </div>
                <div className="text-lg font-bold text-green-600">{formatCurrency(stats.totalRefunds)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Pending Refunds</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingRefunds}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search terminations..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex items-center gap-3 overflow-x-auto">
              <Select value={selectedCustomerId || "all"} onValueChange={handleCustomerChange}>
                <SelectTrigger className="w-[200px] flex-shrink-0">
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.CustomerID} value={customer.CustomerID.toString()}>
                      {customer.CustomerFullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPropertyId || "all"} onValueChange={handlePropertyChange}>
                <SelectTrigger className="w-[180px] flex-shrink-0">
                  <SelectValue placeholder="Filter by property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.PropertyID} value={property.PropertyID.toString()}>
                      {property.PropertyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus || "all"} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px] flex-shrink-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {terminationStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-shrink-0">
                <DatePicker value={dateFrom} onChange={handleDateFromChange} placeholder="From date" />
              </div>

              <div className="flex-shrink-0">
                <DatePicker value={dateTo} onChange={handleDateToChange} placeholder="To date" />
              </div>

              <Button variant="outline" onClick={clearFilters} className="flex-shrink-0 whitespace-nowrap">
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Terminations Table */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : terminations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCustomerId || selectedPropertyId || selectedStatus || dateFrom || dateTo
                ? "No terminations found matching your criteria."
                : "No terminations found. Create your first termination to get started."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Termination #</TableHead>
                    <TableHead>Contract & Customer</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Security Deposit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terminations.map((termination) => (
                    <TableRow key={termination.TerminationID}>
                      <TableCell>
                        <div className="font-medium">{termination.TerminationNo}</div>
                        <div className="text-sm text-muted-foreground">ID: {termination.TerminationID}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div className="font-medium">{termination.ContractNo}</div>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div className="text-sm">{termination.CustomerFullName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{termination.PropertyName}</div>
                            {termination.UnitNumbers && <div className="text-sm text-muted-foreground">Units: {termination.UnitNumbers}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Notice:</span>
                            <span>{formatDate(termination.NoticeDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Effective:</span>
                            <span className="font-medium">{formatDate(termination.EffectiveDate)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{formatCurrency(termination.SecurityDepositAmount)}</div>
                          {termination.RefundAmount > 0 && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Refund:</span>
                              <span className="font-medium text-green-600 ml-1">{formatCurrency(termination.RefundAmount)}</span>
                              {termination.IsRefundProcessed && (
                                <Badge variant="outline" className="ml-2 text-xs py-0">
                                  Processed
                                </Badge>
                              )}
                            </div>
                          )}
                          {termination.CreditNoteAmount > 0 && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Credit:</span>
                              <span className="font-medium text-red-600 ml-1">{formatCurrency(termination.CreditNoteAmount)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{renderStatusBadge(termination.TerminationStatus)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {termination.CreatedBy && <div>{termination.CreatedBy}</div>}
                          {termination.CreatedOn && <div className="text-muted-foreground">{formatDate(termination.CreatedOn)}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewTermination(termination)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTermination(termination)} disabled={termination.TerminationStatus === "Completed"}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuLabel className="font-medium text-muted-foreground">Change Status</DropdownMenuLabel>

                            {terminationStatusOptions
                              .filter((status) => status !== termination.TerminationStatus)
                              .map((status) => (
                                <DropdownMenuItem key={status} onClick={() => handleChangeStatus(termination, status)}>
                                  Set as {status}
                                </DropdownMenuItem>
                              ))}

                            {termination.TerminationStatus === "Approved" && termination.RefundAmount > 0 && !termination.IsRefundProcessed && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openRefundDialog(termination)}>
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Process Refund
                                </DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => openDeleteDialog(termination)}
                              disabled={termination.TerminationStatus === "Approved" || termination.TerminationStatus === "Completed"}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteTermination}
        title="Delete Termination"
        description={
          selectedTermination
            ? `Are you sure you want to delete termination "${selectedTermination.TerminationNo}"? This action cannot be undone.`
            : "Are you sure you want to delete this termination?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      {/* Refund Processing Dialog */}
      <ConfirmationDialog
        isOpen={isRefundDialogOpen}
        onClose={closeRefundDialog}
        onConfirm={handleProcessRefund}
        title="Process Refund"
        description={
          <div className="space-y-4">
            <p>Enter refund details for termination {selectedTermination?.TerminationNo}:</p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Refund Date</label>
              <DatePicker value={refundDate} onChange={setRefundDate} placeholder="Select refund date" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Refund Reference</label>
              <Input placeholder="Enter refund reference" value={refundReference} onChange={(e) => setRefundReference(e.target.value)} />
            </div>
          </div>
        }
        cancelText="Cancel"
        confirmText="Process Refund"
        type="warning"
        confirmDisabled={!refundDate || !refundReference}
      />
    </div>
  );
};

export default TerminationList;
