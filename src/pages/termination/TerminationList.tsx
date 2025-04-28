// src/pages/termination/TerminationList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Plus, Filter, Calendar, User, FileText, DollarSign, Home } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { terminationService, ContractTermination } from "@/services/terminationService";
import { customerService } from "@/services/customerService";
import { propertyService } from "@/services/propertyService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TerminationList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [terminations, setTerminations] = useState<ContractTermination[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTermination, setSelectedTermination] = useState<ContractTermination | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundDate, setRefundDate] = useState<Date | null>(new Date());
  const [refundReference, setRefundReference] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  // Filters
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Termination status options
  const terminationStatusOptions = ["Draft", "Pending", "Approved", "Completed", "Cancelled"];

  // Fetch data on component mount
  useEffect(() => {
    fetchTerminations();
    fetchCustomers();
    fetchProperties();
  }, []);

  // Fetch all terminations
  const fetchTerminations = async (search?: string, filters?: any) => {
    try {
      setLoading(true);
      const terminationsData = await terminationService.searchTerminations({
        searchText: search,
        customerID: filters?.customerID,
        terminationStatus: filters?.terminationStatus,
        fromDate: filters?.fromDate,
        toDate: filters?.toDate,
        propertyID: filters?.propertyID,
      });
      setTerminations(terminationsData);
    } catch (error) {
      console.error("Error fetching terminations:", error);
      toast.error("Failed to load terminations");
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers for filter dropdown
  const fetchCustomers = async () => {
    try {
      const customersData = await customerService.getAllCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  // Fetch properties for filter dropdown
  const fetchProperties = async () => {
    try {
      const propertiesData = await propertyService.getAllProperties();
      setProperties(propertiesData);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  // Apply filters
  const applyFilters = () => {
    const filters = {
      customerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      propertyID: selectedPropertyId ? parseInt(selectedPropertyId) : undefined,
      terminationStatus: selectedStatus || undefined,
      fromDate: fromDate,
      toDate: toDate,
    };
    fetchTerminations(searchTerm, filters);
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      setSearchTerm(value);
      applyFilters();
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Handle filter changes
  useEffect(() => {
    applyFilters();
  }, [selectedCustomerId, selectedPropertyId, selectedStatus, fromDate, toDate]);

  // Navigation handlers
  const handleAddTermination = () => {
    navigate("/terminations/new");
  };

  const handleEditTermination = (terminationId: number) => {
    navigate(`/terminations/edit/${terminationId}`);
  };

  const handleViewTermination = (terminationId: number) => {
    navigate(`/terminations/${terminationId}`);
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
        // Update termination in the list
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
        // Update termination in the list
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

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Get status color for badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "default";
      case "Draft":
        return "secondary";
      case "Pending":
        return "outline";
      case "Completed":
        return "default";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Contract Termination Management</h1>
        <Button onClick={handleAddTermination}>
          <Plus className="mr-2 h-4 w-4" />
          New Termination
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Terminations</CardTitle>
          <CardDescription>Manage rental contract terminations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search terminations..." className="pl-9" onChange={handleSearchChange} />
            </div>

            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.CustomerID} value={customer.CustomerID.toString()}>
                    {customer.CustomerFullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.PropertyID} value={property.PropertyID.toString()}>
                    {property.PropertyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Statuses</SelectItem>
                {terminationStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 border-dashed">
                    <Calendar className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PP") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker value={fromDate} onChange={setFromDate} placeholder="From Date" />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 border-dashed">
                    <Calendar className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PP") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker value={toDate} onChange={setToDate} placeholder="To Date" disabled={(date) => (fromDate ? date < fromDate : false)} />
                </PopoverContent>
              </Popover>

              {(fromDate || toDate || selectedCustomerId || selectedPropertyId || selectedStatus) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFromDate(null);
                    setToDate(null);
                    setSelectedCustomerId("");
                    setSelectedPropertyId("");
                    setSelectedStatus("");
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : terminations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCustomerId || selectedPropertyId || selectedStatus || fromDate || toDate
                ? "No terminations found matching your criteria."
                : "No terminations have been created yet."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Termination #</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Security Deposit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terminations.map((termination) => (
                    <TableRow key={termination.TerminationID}>
                      <TableCell>
                        <div className="font-medium">{termination.TerminationNo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div>{termination.ContractNo}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>{termination.CustomerFullName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div>{termination.PropertyName}</div>
                            {termination.UnitNumbers && <div className="text-sm text-muted-foreground">Units: {termination.UnitNumbers}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Notice: {formatDate(termination.NoticeDate)}</div>
                          <div>
                            Effective: <span className="font-medium">{formatDate(termination.EffectiveDate)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(termination.SecurityDepositAmount)}</div>
                        {termination.RefundAmount > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Refund: {formatCurrency(termination.RefundAmount)}
                            {termination.IsRefundProcessed && (
                              <Badge variant="outline" className="ml-2 text-xs py-0">
                                Processed
                              </Badge>
                            )}
                          </div>
                        )}
                        {termination.CreditNoteAmount > 0 && <div className="text-sm text-muted-foreground">Credit: {formatCurrency(termination.CreditNoteAmount)}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(termination.TerminationStatus)}>{termination.TerminationStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewTermination(termination.TerminationID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTermination(termination.TerminationID)} disabled={termination.TerminationStatus === "Completed"}>
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem disabled className="font-medium text-muted-foreground">
                              Change Status
                            </DropdownMenuItem>

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
                                <DropdownMenuItem onClick={() => openRefundDialog(termination)}>Process Refund</DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => openDeleteDialog(termination)}
                              disabled={termination.TerminationStatus === "Approved" || termination.TerminationStatus === "Completed"}
                            >
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

      {/* Confirmation Dialog for Delete */}
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

      {/* Confirmation Dialog for Refund Processing */}
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
