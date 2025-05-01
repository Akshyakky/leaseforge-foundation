// src/pages/invoice/LeaseInvoiceList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Search, Plus, Filter, Calendar, User, FileText, Receipt, DollarSign, Building } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { leaseInvoiceService } from "@/services/leaseInvoiceService";
import { customerService } from "@/services/customerService";
import { contractService } from "@/services/contractService";
import { unitService } from "@/services/unitService";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LeaseInvoice } from "@/types/leaseInvoiceTypes";

const LeaseInvoiceList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<LeaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<LeaseInvoice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Filters
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<string>("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [isPaid, setIsPaid] = useState<boolean | null>(null);

  // Invoice status options
  const invoiceStatusOptions = ["Draft", "Posted", "Paid", "Partially Paid", "Cancelled", "Void"];

  // Invoice type options
  const invoiceTypeOptions = ["Rent", "Service Charge", "Utility", "Security Deposit", "Admin Fee", "Other"];

  // Fetch data on component mount
  useEffect(() => {
    fetchInvoices();
    fetchReferenceData();
  }, []);

  // Fetch all invoices
  const fetchInvoices = async (search?: string, filters?: any) => {
    try {
      setLoading(true);
      const invoicesData = await leaseInvoiceService.searchInvoices({
        searchText: search,
        customerID: filters?.customerID,
        contractID: filters?.contractID,
        unitID: filters?.unitID,
        invoiceStatus: filters?.invoiceStatus,
        invoiceType: filters?.invoiceType,
        fromDate: filters?.fromDate,
        toDate: filters?.toDate,
        isPaid: filters?.isPaid,
      });
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
      const [customersData, contractsData, unitsData] = await Promise.all([customerService.getAllCustomers(), contractService.getAllContracts(), unitService.getAllUnits()]);
      setCustomers(customersData);
      setContracts(contractsData);
      setUnits(unitsData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  // Apply filters
  const applyFilters = () => {
    const filters = {
      customerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      contractID: selectedContractId ? parseInt(selectedContractId) : undefined,
      unitID: selectedUnitId ? parseInt(selectedUnitId) : undefined,
      invoiceStatus: selectedStatus || undefined,
      invoiceType: selectedInvoiceType || undefined,
      fromDate: fromDate,
      toDate: toDate,
      isPaid: isPaid,
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
  }, [selectedCustomerId, selectedContractId, selectedUnitId, selectedStatus, selectedInvoiceType, fromDate, toDate, isPaid]);

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
      const response = await leaseInvoiceService.deleteInvoice(selectedInvoice.InvoiceID);

      if (response.Status === 1) {
        setInvoices(invoices.filter((i) => i.InvoiceID !== selectedInvoice.InvoiceID));
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

  // Change invoice status
  const handleChangeStatus = async (invoice: LeaseInvoice, newStatus: string) => {
    try {
      const response = await leaseInvoiceService.updateInvoiceStatus(invoice.InvoiceID, newStatus);

      if (response.Status === 1) {
        // Update invoice in the list
        setInvoices(invoices.map((i) => (i.InvoiceID === invoice.InvoiceID ? { ...i, InvoiceStatus: newStatus } : i)));
        toast.success(`Invoice status changed to ${newStatus}`);
      } else {
        toast.error(response.Message || "Failed to change invoice status");
      }
    } catch (error) {
      console.error("Error changing invoice status:", error);
      toast.error("Failed to change invoice status");
    }
  };

  // Handle post to financial system
  const handlePostToFinancialSystem = async (invoice: LeaseInvoice) => {
    try {
      const response = await leaseInvoiceService.createFinancialPosting(invoice.InvoiceID);

      if (response.Status === 1) {
        // Update invoice in the list
        setInvoices(invoices.map((i) => (i.InvoiceID === invoice.InvoiceID ? { ...i, PostingID: response.PostingID, PostingStatus: "Posted" } : i)));
        toast.success("Invoice posted to financial system successfully");
      } else {
        toast.error(response.Message || "Failed to post invoice to financial system");
      }
    } catch (error) {
      console.error("Error posting invoice to financial system:", error);
      toast.error("Failed to post invoice to financial system");
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
      case "Paid":
        return "default";
      case "Draft":
        return "secondary";
      case "Posted":
        return "outline";
      case "Partially Paid":
        return "outline";
      case "Cancelled":
      case "Void":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Determine if invoice is overdue
  const isOverdue = (invoice: LeaseInvoice) => {
    if (invoice.InvoiceStatus === "Paid") return false;
    if (!invoice.DueDate) return false;

    const dueDate = new Date(invoice.DueDate);
    const today = new Date();
    return dueDate < today;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Lease Invoice Management</h1>
        <Button onClick={handleAddInvoice}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Manage lease invoices for properties and units</CardDescription>
        </CardHeader>
        <CardContent>
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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
            </div>

            <Button variant="outline" size="sm" onClick={() => setIsPaid(isPaid === true ? null : true)}>
              {isPaid === true ? "✓ Paid Only" : "Paid Only"}
            </Button>

            <Button variant="outline" size="sm" onClick={() => setIsPaid(isPaid === false ? null : false)}>
              {isPaid === false ? "✓ Unpaid Only" : "Unpaid Only"}
            </Button>

            {(fromDate || toDate || selectedCustomerId || selectedContractId || selectedUnitId || selectedStatus || selectedInvoiceType || isPaid !== null) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFromDate(null);
                  setToDate(null);
                  setSelectedCustomerId("");
                  setSelectedContractId("");
                  setSelectedUnitId("");
                  setSelectedStatus("");
                  setSelectedInvoiceType("");
                  setIsPaid(null);
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCustomerId || selectedContractId || selectedUnitId || selectedStatus || selectedInvoiceType || fromDate || toDate || isPaid !== null
                ? "No invoices found matching your criteria."
                : "No invoices have been created yet."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Property/Unit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.InvoiceID} className={isOverdue(invoice) ? "bg-red-50" : ""}>
                      <TableCell>
                        <div className="font-medium">{invoice.InvoiceNo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>{invoice.CustomerFullName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>{invoice.ContractNo}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div>{invoice.PropertyName}</div>
                            {invoice.UnitNo && <div className="text-sm text-muted-foreground">Unit: {invoice.UnitNo}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{invoice.InvoiceType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Invoice: {formatDate(invoice.InvoiceDate)}</div>
                          <div>
                            Due: <span className={isOverdue(invoice) ? "font-bold text-red-600" : ""}>{formatDate(invoice.DueDate)}</span>
                          </div>
                          {invoice.InvoicePeriodFrom && invoice.InvoicePeriodTo && (
                            <div className="text-xs text-muted-foreground">
                              Period: {formatDate(invoice.InvoicePeriodFrom)} - {formatDate(invoice.InvoicePeriodTo)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(invoice.TotalAmount)}</div>
                        {invoice.PaidAmount > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Paid: {formatCurrency(invoice.PaidAmount)}
                            {invoice.BalanceAmount > 0 && <span> (Balance: {formatCurrency(invoice.BalanceAmount)})</span>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.InvoiceStatus)}>{invoice.InvoiceStatus}</Badge>
                        {isOverdue(invoice) && (
                          <Badge variant="destructive" className="ml-2">
                            Overdue
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewInvoice(invoice.InvoiceID)}>View details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice.InvoiceID)} disabled={invoice.InvoiceStatus !== "Draft"}>
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem disabled className="font-medium text-muted-foreground">
                              Change Status
                            </DropdownMenuItem>

                            {invoiceStatusOptions
                              .filter((status) => status !== invoice.InvoiceStatus)
                              .map((status) => (
                                <DropdownMenuItem key={status} onClick={() => handleChangeStatus(invoice, status)}>
                                  Set as {status}
                                </DropdownMenuItem>
                              ))}

                            <DropdownMenuSeparator />

                            {invoice.InvoiceStatus === "Posted" && !invoice.PostingID && (
                              <DropdownMenuItem onClick={() => handlePostToFinancialSystem(invoice)}>Post to Financial System</DropdownMenuItem>
                            )}

                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(invoice)} disabled={invoice.InvoiceStatus !== "Draft"}>
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
    </div>
  );
};

export default LeaseInvoiceList;
