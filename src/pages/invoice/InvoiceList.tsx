// src/pages/invoice/InvoiceList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Plus, Calendar, User, FileText, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invoiceService, LeaseInvoice } from "@/services/invoiceService";
import { customerService } from "@/services/customerService";
import { contractService } from "@/services/contractService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<LeaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<LeaseInvoice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState("all");

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  // Filters
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string>("");
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Invoice status and type options
  const invoiceStatusOptions = ["Draft", "Pending", "Sent", "Partial", "Paid", "Overdue", "Cancelled"];
  const invoiceTypeOptions = ["Regular", "Advance", "Security Deposit", "Penalty", "Adjustment"];

  // Fetch data on component mount
  useEffect(() => {
    fetchInvoices();
    fetchReferenceData();
  }, []);

  // Fetch all invoices
  const fetchInvoices = async (search?: string, filters?: any) => {
    try {
      setLoading(true);
      let invoicesData: LeaseInvoice[] = [];

      if (activeTab === "overdue") {
        invoicesData = await invoiceService.getOverdueInvoices({
          filterCustomerID: filters?.customerID,
        });
      } else {
        invoicesData = await invoiceService.searchInvoices({
          searchText: search,
          filterCustomerID: filters?.customerID,
          filterContractID: filters?.contractID,
          filterInvoiceStatus: filters?.invoiceStatus,
          filterInvoiceType: filters?.invoiceType,
          filterFromDate: filters?.fromDate,
          filterToDate: filters?.toDate,
        });
      }

      // Apply tab-specific filtering
      if (activeTab !== "all" && activeTab !== "overdue") {
        invoicesData = invoicesData.filter((invoice) => {
          switch (activeTab) {
            case "pending":
              return ["Draft", "Pending", "Sent"].includes(invoice.InvoiceStatus);
            case "paid":
              return invoice.InvoiceStatus === "Paid";
            case "partial":
              return invoice.InvoiceStatus === "Partial";
            default:
              return true;
          }
        });
      }

      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [customersData, contractsData] = await Promise.all([customerService.getAllCustomers(), contractService.getAllContracts()]);
      setCustomers(customersData);
      setContracts(contractsData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  // Apply filters
  const applyFilters = () => {
    const filters = {
      customerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      contractID: selectedContractId ? parseInt(selectedContractId) : undefined,
      invoiceStatus: selectedInvoiceStatus || undefined,
      invoiceType: selectedInvoiceType || undefined,
      fromDate: fromDate,
      toDate: toDate,
    };
    fetchInvoices(searchTerm, filters);
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
  }, [selectedCustomerId, selectedContractId, selectedInvoiceStatus, selectedInvoiceType, fromDate, toDate, activeTab]);

  // Navigation handlers
  const handleAddInvoice = () => {
    navigate("/invoices/new");
  };

  const handleEditInvoice = (invoiceId: number) => {
    navigate(`/invoices/edit/${invoiceId}`);
  };

  const handleViewInvoice = (invoiceId: number) => {
    navigate(`/invoices/${invoiceId}`);
  };

  // Delete invoice handlers
  const openDeleteDialog = (invoice: LeaseInvoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      const response = await invoiceService.deleteInvoice(selectedInvoice.LeaseInvoiceID);

      if (response.Status === 1) {
        setInvoices(invoices.filter((i) => i.LeaseInvoiceID !== selectedInvoice.LeaseInvoiceID));
        toast.success("Invoice deleted successfully");
      } else {
        toast.error(response.Message || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    } finally {
      closeDeleteDialog();
    }
  };

  // Status change handlers
  const openStatusChangeDialog = (invoice: LeaseInvoice, status: string) => {
    setSelectedInvoice(invoice);
    setSelectedStatus(status);
    setIsStatusChangeDialogOpen(true);
  };

  const closeStatusChangeDialog = () => {
    setIsStatusChangeDialogOpen(false);
    setSelectedInvoice(null);
    setSelectedStatus("");
  };

  const handleChangeStatus = async () => {
    if (!selectedInvoice || !selectedStatus) return;

    try {
      const response = await invoiceService.changeInvoiceStatus(selectedInvoice.LeaseInvoiceID, selectedStatus);

      if (response.Status === 1) {
        setInvoices(invoices.map((i) => (i.LeaseInvoiceID === selectedInvoice.LeaseInvoiceID ? { ...i, InvoiceStatus: selectedStatus } : i)));
        toast.success(`Invoice status changed to ${selectedStatus}`);
      } else {
        toast.error(response.Message || "Failed to change invoice status");
      }
    } catch (error) {
      console.error("Error changing invoice status:", error);
      toast.error("Failed to change invoice status");
    } finally {
      closeStatusChangeDialog();
    }
  };

  // Post invoice to GL
  const handlePostToGL = async (invoice: LeaseInvoice) => {
    try {
      const response = await invoiceService.postInvoiceToGL(invoice.LeaseInvoiceID);

      if (response.Status === 1) {
        toast.success("Invoice posted to GL successfully");
        // Refresh the invoice list
        applyFilters();
      } else {
        toast.error(response.Message || "Failed to post invoice to GL");
      }
    } catch (error) {
      console.error("Error posting invoice to GL:", error);
      toast.error("Failed to post invoice to GL");
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
    if (amount === undefined || amount === null) return "0.00";
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Get status color for badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Draft":
        return "secondary";
      case "Pending":
      case "Sent":
        return "outline";
      case "Partial":
        return "default";
      case "Overdue":
        return "destructive";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="h-3 w-3" />;
      case "Overdue":
        return <AlertTriangle className="h-3 w-3" />;
      case "Partial":
        return <Clock className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  // Get tab counts
  const getTabCounts = () => {
    return {
      all: invoices.length,
      pending: invoices.filter((i) => ["Draft", "Pending", "Sent"].includes(i.InvoiceStatus)).length,
      paid: invoices.filter((i) => i.InvoiceStatus === "Paid").length,
      partial: invoices.filter((i) => i.InvoiceStatus === "Partial").length,
      overdue: invoices.filter((i) => i.InvoiceStatus === "Overdue" || (i.OverdueDays && i.OverdueDays > 0)).length,
    };
  };

  const tabCounts = getTabCounts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Invoice Management</h1>
        <Button onClick={handleAddInvoice}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Manage lease invoices and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-[500px] mb-6">
              <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({tabCounts.pending})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({tabCounts.paid})</TabsTrigger>
              <TabsTrigger value="partial">Partial ({tabCounts.partial})</TabsTrigger>
              <TabsTrigger value="overdue">Overdue ({tabCounts.overdue})</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search invoices..." className="pl-9" onChange={handleSearchChange} />
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

              <Select value={selectedContractId} onValueChange={setSelectedContractId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Contracts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Contracts</SelectItem>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.ContractID} value={contract.ContractID.toString()}>
                      {contract.ContractNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedInvoiceStatus} onValueChange={setSelectedInvoiceStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Statuses</SelectItem>
                  {invoiceStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedInvoiceType} onValueChange={setSelectedInvoiceType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Types</SelectItem>
                  {invoiceTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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

                {(fromDate || toDate || selectedCustomerId || selectedContractId || selectedInvoiceStatus || selectedInvoiceType) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFromDate(null);
                      setToDate(null);
                      setSelectedCustomerId("");
                      setSelectedContractId("");
                      setSelectedInvoiceStatus("");
                      setSelectedInvoiceType("");
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchTerm || selectedCustomerId || selectedContractId || selectedInvoiceStatus || fromDate || toDate
                    ? "No invoices found matching your criteria."
                    : "No invoices have been created yet."}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contract</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Invoice Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.LeaseInvoiceID} className={invoice.OverdueDays && invoice.OverdueDays > 0 ? "bg-red-50" : ""}>
                          <TableCell>
                            <div className="font-medium">{invoice.InvoiceNo}</div>
                            {invoice.OverdueDays && invoice.OverdueDays > 0 && (
                              <div className="text-xs text-red-600 flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {invoice.OverdueDays} days overdue
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>{invoice.CustomerFullName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{invoice.ContractNo}</div>
                            <div className="text-sm text-muted-foreground">{invoice.UnitNo}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{invoice.InvoiceType}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(invoice.InvoiceDate)}</TableCell>
                          <TableCell>
                            <div className={invoice.OverdueDays && invoice.OverdueDays > 0 ? "text-red-600 font-medium" : ""}>{formatDate(invoice.DueDate)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(invoice.TotalAmount)}</div>
                            {invoice.TaxAmount > 0 && <div className="text-sm text-muted-foreground">Tax: {formatCurrency(invoice.TaxAmount)}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(invoice.BalanceAmount)}</div>
                            {invoice.PaidAmount > 0 && <div className="text-sm text-muted-foreground">Paid: {formatCurrency(invoice.PaidAmount)}</div>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(invoice.InvoiceStatus)} className="flex items-center gap-1">
                              {getStatusIcon(invoice.InvoiceStatus)}
                              {invoice.InvoiceStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewInvoice(invoice.LeaseInvoiceID)}>View details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditInvoice(invoice.LeaseInvoiceID)} disabled={invoice.InvoiceStatus === "Paid"}>
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem disabled className="font-medium text-muted-foreground">
                                  Change Status
                                </DropdownMenuItem>

                                {invoiceStatusOptions
                                  .filter((status) => status !== invoice.InvoiceStatus)
                                  .map((status) => (
                                    <DropdownMenuItem key={status} onClick={() => openStatusChangeDialog(invoice, status)}>
                                      Set as {status}
                                    </DropdownMenuItem>
                                  ))}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={() => handlePostToGL(invoice)} disabled={invoice.InvoiceStatus === "Draft" || invoice.InvoiceStatus === "Cancelled"}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Post to GL
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  className="text-red-500"
                                  onClick={() => openDeleteDialog(invoice)}
                                  disabled={invoice.InvoiceStatus === "Paid" || invoice.PaidAmount > 0}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice"
        description={
          selectedInvoice
            ? `Are you sure you want to delete invoice "${selectedInvoice.InvoiceNo}"? This action cannot be undone.`
            : "Are you sure you want to delete this invoice?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />

      {/* Status Change Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isStatusChangeDialogOpen}
        onClose={closeStatusChangeDialog}
        onConfirm={handleChangeStatus}
        title="Change Invoice Status"
        description={
          selectedInvoice && selectedStatus
            ? `Are you sure you want to change the status of invoice "${selectedInvoice.InvoiceNo}" to "${selectedStatus}"?`
            : "Are you sure you want to change the invoice status?"
        }
        cancelText="Cancel"
        confirmText="Change Status"
        type="warning"
      />
    </div>
  );
};

export default InvoiceList;
