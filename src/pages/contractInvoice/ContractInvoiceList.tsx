// src/pages/contractInvoice/ContractInvoiceList.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  MoreHorizontal,
  Search,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  Send,
  CreditCard,
  RefreshCw,
  Download,
  Filter,
  Users,
  Receipt,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { contractInvoiceService } from "@/services/contractInvoiceService";
import { customerService } from "@/services/customerService";
import { propertyService } from "@/services/propertyService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { accountService } from "@/services/accountService";
import { FormField } from "@/components/forms/FormField";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ContractInvoice,
  InvoiceSearchParams,
  InvoiceStatistics,
  InvoicePostingRequest,
  BulkInvoicePostingRequest,
  SelectedInvoiceForPosting,
  InvoicePaymentRequest,
} from "@/types/contractInvoiceTypes";

// Payment recording schema
const paymentSchema = z.object({
  paymentAmount: z.coerce.number().min(0.01, "Payment amount must be greater than 0"),
  paymentDate: z.date({ required_error: "Payment date is required" }),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

// Posting schema
const postingSchema = z.object({
  postingDate: z.date({ required_error: "Posting date is required" }),
  debitAccountId: z.string().min(1, "Debit account is required"),
  creditAccountId: z.string().min(1, "Credit account is required"),
  narration: z.string().optional(),
  exchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;
type PostingFormValues = z.infer<typeof postingSchema>;

const ContractInvoiceList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<ContractInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
  const [bulkPostingDialogOpen, setBulkPostingDialogOpen] = useState(false);

  // Selected items for actions
  const [selectedInvoice, setSelectedInvoice] = useState<ContractInvoice | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  // Filter states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [dueDateFrom, setDueDateFrom] = useState<Date | undefined>();
  const [dueDateTo, setDueDateTo] = useState<Date | undefined>();
  const [showPostedOnly, setShowPostedOnly] = useState<boolean | undefined>();
  const [showOverdueOnly, setShowOverdueOnly] = useState<boolean | undefined>();

  // Statistics
  const [statistics, setStatistics] = useState<InvoiceStatistics>({
    statusCounts: [],
    overdueInvoices: { OverdueCount: 0, OverdueAmount: 0, AvgDaysOverdue: 0 },
    monthlyTrends: [],
  });

  // Active tab
  const [activeTab, setActiveTab] = useState("all");

  // Form instances
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: new Date(),
      paymentMethod: "Cash",
    },
  });

  const postingForm = useForm<PostingFormValues>({
    resolver: zodResolver(postingSchema),
    defaultValues: {
      postingDate: new Date(),
      exchangeRate: 1,
    },
  });

  // Invoice status and type options
  const invoiceStatusOptions = ["Draft", "Pending", "Approved", "Active", "Paid", "Cancelled", "Voided"];
  const invoiceTypeOptions = ["Rent", "Security Deposit", "Admin Fee", "Utilities", "Maintenance", "Custom"];
  const paymentMethodOptions = ["Cash", "Cheque", "Bank Transfer", "Credit Card", "Online"];

  // Fetch data on component mount
  useEffect(() => {
    fetchInvoices();
    fetchReferenceData();
    fetchStatistics();
  }, []);

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [customersData, propertiesData, companiesData, fiscalYearsData, accountsData] = await Promise.all([
        customerService.getAllCustomers(),
        propertyService.getAllProperties(),
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
        accountService.getAllAccounts(),
      ]);

      setCustomers(customersData);
      setProperties(propertiesData);
      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
      setAccounts(accountsData.filter((acc) => acc.IsActive && acc.IsPostable));
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const stats = await contractInvoiceService.getInvoiceStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Fetch invoices with filters
  const fetchInvoices = async (filters?: InvoiceSearchParams) => {
    try {
      setLoading(true);
      const invoicesData = await contractInvoiceService.searchInvoices(filters || {});
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
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
    const filters: InvoiceSearchParams = {
      searchText: searchTerm || undefined,
      FilterCustomerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      FilterPropertyID: selectedPropertyId ? parseInt(selectedPropertyId) : undefined,
      FilterInvoiceStatus: selectedStatus || undefined,
      FilterInvoiceType: selectedType || undefined,
      FilterFromDate: dateFrom,
      FilterToDate: dateTo,
      FilterDueDateFrom: dueDateFrom,
      FilterDueDateTo: dueDateTo,
      FilterPostedOnly: showPostedOnly,
      FilterOverdueOnly: showOverdueOnly,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof InvoiceSearchParams] === undefined) {
        delete filters[key as keyof InvoiceSearchParams];
      }
    });

    fetchInvoices(filters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCustomerId("");
    setSelectedPropertyId("");
    setSelectedStatus("");
    setSelectedType("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setDueDateFrom(undefined);
    setDueDateTo(undefined);
    setShowPostedOnly(undefined);
    setShowOverdueOnly(undefined);
    setSelectedInvoices(new Set());
    fetchInvoices();
  };

  // Navigation handlers
  const handleCreateInvoice = () => {
    navigate("/invoices/new");
  };

  const handleViewInvoice = (invoice: ContractInvoice) => {
    navigate(`/invoices/${invoice.LeaseInvoiceID}`);
  };

  const handleEditInvoice = (invoice: ContractInvoice) => {
    navigate(`/invoices/edit/${invoice.LeaseInvoiceID}`);
  };

  // Selection handlers
  const handleSelectInvoice = (invoiceId: number, checked: boolean) => {
    const newSelection = new Set(selectedInvoices);
    if (checked) {
      newSelection.add(invoiceId);
    } else {
      newSelection.delete(invoiceId);
    }
    setSelectedInvoices(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filteredIds = getFilteredInvoices().map((inv) => inv.LeaseInvoiceID);
      setSelectedInvoices(new Set(filteredIds));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  // Get filtered invoices based on active tab
  const getFilteredInvoices = () => {
    switch (activeTab) {
      case "unposted":
        return invoices.filter((inv) => !inv.IsPosted);
      case "posted":
        return invoices.filter((inv) => inv.IsPosted);
      case "overdue":
        return invoices.filter((inv) => inv.IsOverdue);
      case "paid":
        return invoices.filter((inv) => inv.InvoiceStatus === "Paid");
      default:
        return invoices;
    }
  };

  // Status change handlers
  const openStatusChangeDialog = (invoice: ContractInvoice, status: string) => {
    setSelectedInvoice(invoice);
    setNewStatus(status);
    setStatusChangeDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!selectedInvoice || !newStatus) return;

    try {
      setActionLoading(true);
      const response = await contractInvoiceService.changeInvoiceStatus(selectedInvoice.LeaseInvoiceID, newStatus);

      if (response.Status === 1) {
        // Update invoice in the list
        setInvoices(invoices.map((inv) => (inv.LeaseInvoiceID === selectedInvoice.LeaseInvoiceID ? { ...inv, InvoiceStatus: newStatus } : inv)));
        toast.success(`Invoice status changed to ${newStatus}`);
        setStatusChangeDialogOpen(false);
        setSelectedInvoice(null);
        setNewStatus("");
      } else {
        toast.error(response.Message || "Failed to change invoice status");
      }
    } catch (error) {
      console.error("Error changing invoice status:", error);
      toast.error("Failed to change invoice status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (invoice: ContractInvoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      setActionLoading(true);
      const response = await contractInvoiceService.deleteInvoice(selectedInvoice.LeaseInvoiceID);

      if (response.Status === 1) {
        setInvoices(invoices.filter((inv) => inv.LeaseInvoiceID !== selectedInvoice.LeaseInvoiceID));
        toast.success("Invoice deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedInvoice(null);
      } else {
        toast.error(response.Message || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    } finally {
      setActionLoading(false);
    }
  };

  // Payment handlers
  const openPaymentDialog = (invoice: ContractInvoice) => {
    setSelectedInvoice(invoice);
    paymentForm.setValue("paymentAmount", invoice.BalanceAmount);
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = async (data: PaymentFormValues) => {
    if (!selectedInvoice) return;

    try {
      setActionLoading(true);
      const paymentRequest: InvoicePaymentRequest = {
        LeaseInvoiceID: selectedInvoice.LeaseInvoiceID,
        PaymentAmount: data.paymentAmount,
        PaymentDate: data.paymentDate,
        PaymentMethod: data.paymentMethod,
        PaymentReference: data.paymentReference,
        Notes: data.notes,
      };

      const response = await contractInvoiceService.recordPayment(paymentRequest);

      if (response.Status === 1) {
        // Update invoice in the list
        setInvoices(
          invoices.map((inv) =>
            inv.LeaseInvoiceID === selectedInvoice.LeaseInvoiceID
              ? {
                  ...inv,
                  PaidAmount: inv.PaidAmount + data.paymentAmount,
                  BalanceAmount: inv.BalanceAmount - data.paymentAmount,
                  InvoiceStatus: inv.BalanceAmount - data.paymentAmount <= 0 ? "Paid" : inv.InvoiceStatus,
                }
              : inv
          )
        );
        toast.success("Payment recorded successfully");
        setPaymentDialogOpen(false);
        setSelectedInvoice(null);
        paymentForm.reset();
      } else {
        toast.error(response.Message || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setActionLoading(false);
    }
  };

  // Posting handlers
  const openPostingDialog = (invoice: ContractInvoice) => {
    setSelectedInvoice(invoice);
    setPostingDialogOpen(true);
  };

  const handlePostInvoice = async (data: PostingFormValues) => {
    if (!selectedInvoice) return;

    try {
      setActionLoading(true);
      const postingRequest: InvoicePostingRequest = {
        LeaseInvoiceID: selectedInvoice.LeaseInvoiceID,
        PostingDate: data.postingDate,
        DebitAccountID: parseInt(data.debitAccountId),
        CreditAccountID: parseInt(data.creditAccountId),
        PostingNarration: data.narration,
        ExchangeRate: data.exchangeRate,
      };

      const response = await contractInvoiceService.postSingleInvoice(postingRequest);

      if (response.Status === 1) {
        // Update invoice in the list
        setInvoices(invoices.map((inv) => (inv.LeaseInvoiceID === selectedInvoice.LeaseInvoiceID ? { ...inv, IsPosted: true } : inv)));
        toast.success("Invoice posted successfully");
        setPostingDialogOpen(false);
        setSelectedInvoice(null);
        postingForm.reset();
      } else {
        toast.error(response.Message || "Failed to post invoice");
      }
    } catch (error) {
      console.error("Error posting invoice:", error);
      toast.error("Failed to post invoice");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk posting handlers
  const handleBulkPost = async (data: PostingFormValues) => {
    if (selectedInvoices.size === 0) return;

    try {
      setActionLoading(true);
      const selectedInvoicesList = Array.from(selectedInvoices)
        .map((id) => invoices.find((inv) => inv.LeaseInvoiceID === id))
        .filter(Boolean) as ContractInvoice[];

      const selectedForPosting: SelectedInvoiceForPosting[] = selectedInvoicesList.map((invoice) => ({
        LeaseInvoiceID: invoice.LeaseInvoiceID,
        PostingAmount: invoice.TotalAmount,
        DebitAccountID: parseInt(data.debitAccountId),
        CreditAccountID: parseInt(data.creditAccountId),
        Narration: data.narration || `Lease Invoice - ${invoice.InvoiceNo}`,
      }));

      const bulkPostingRequest: BulkInvoicePostingRequest = {
        PostingDate: data.postingDate,
        ExchangeRate: data.exchangeRate,
        SelectedInvoices: selectedForPosting,
      };

      const response = await contractInvoiceService.postMultipleInvoices(bulkPostingRequest);

      if (response.Status === 1) {
        // Update posted invoices in the list
        setInvoices(invoices.map((inv) => (selectedInvoices.has(inv.LeaseInvoiceID) ? { ...inv, IsPosted: true } : inv)));
        toast.success(`Posted ${response.PostedCount} invoices successfully`);
        if (response.FailedCount && response.FailedCount > 0) {
          toast.warning(`${response.FailedCount} invoices failed to post`);
        }
        setBulkPostingDialogOpen(false);
        setSelectedInvoices(new Set());
        postingForm.reset();
      } else {
        toast.error(response.Message || "Failed to post invoices");
      }
    } catch (error) {
      console.error("Error posting invoices:", error);
      toast.error("Failed to post invoices");
    } finally {
      setActionLoading(false);
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, icon: FileText, className: "bg-gray-100 text-gray-800" },
      Pending: { variant: "default" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Approved: { variant: "default" as const, icon: CheckCircle, className: "bg-blue-100 text-blue-800" },
      Active: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Paid: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Cancelled: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
      Voided: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
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

  // Calculate statistics
  const filteredInvoices = getFilteredInvoices();
  const stats = {
    total: invoices.length,
    unposted: invoices.filter((inv) => !inv.IsPosted).length,
    posted: invoices.filter((inv) => inv.IsPosted).length,
    overdue: invoices.filter((inv) => inv.IsOverdue).length,
    paid: invoices.filter((inv) => inv.InvoiceStatus === "Paid").length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.TotalAmount, 0),
    outstandingAmount: invoices.reduce((sum, inv) => sum + inv.BalanceAmount, 0),
    selectedCount: selectedInvoices.size,
    selectedAmount: Array.from(selectedInvoices).reduce((sum, id) => {
      const invoice = invoices.find((inv) => inv.LeaseInvoiceID === id);
      return sum + (invoice?.TotalAmount || 0);
    }, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Contract Invoice Management</h1>
          <p className="text-muted-foreground">Manage lease invoices and revenue posting</p>
        </div>
        <div className="flex gap-2">
          {selectedInvoices.size > 0 && (
            <Button onClick={() => setBulkPostingDialogOpen(true)} disabled={selectedInvoices.size === 0}>
              <Send className="mr-2 h-4 w-4" />
              Post Selected ({selectedInvoices.size})
            </Button>
          )}
          <Button onClick={handleCreateInvoice}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Invoice
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Contract Invoices</CardTitle>
          <CardDescription>View and manage contract invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
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
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">Unposted</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.unposted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Posted</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.posted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Overdue</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Paid</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.paid}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                </div>
                <div className="text-lg font-bold text-purple-600">{formatCurrency(stats.outstandingAmount)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search invoices..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <Select
                value={selectedCustomerId || "all"}
                onValueChange={(value) => {
                  setSelectedCustomerId(value === "all" ? "" : value);
                  setTimeout(handleFilterChange, 100);
                }}
              >
                <SelectTrigger className="w-[200px] flex-shrink-0">
                  <SelectValue placeholder="Customer" />
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

              <Select
                value={selectedPropertyId || "all"}
                onValueChange={(value) => {
                  setSelectedPropertyId(value === "all" ? "" : value);
                  setTimeout(handleFilterChange, 100);
                }}
              >
                <SelectTrigger className="w-[180px] flex-shrink-0">
                  <SelectValue placeholder="Property" />
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

              <Select
                value={selectedStatus || "all"}
                onValueChange={(value) => {
                  setSelectedStatus(value === "all" ? "" : value);
                  setTimeout(handleFilterChange, 100);
                }}
              >
                <SelectTrigger className="w-[140px] flex-shrink-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {invoiceStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedType || "all"}
                onValueChange={(value) => {
                  setSelectedType(value === "all" ? "" : value);
                  setTimeout(handleFilterChange, 100);
                }}
              >
                <SelectTrigger className="w-[140px] flex-shrink-0">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {invoiceTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-shrink-0">
                <DatePicker
                  value={dateFrom}
                  onChange={(date) => {
                    setDateFrom(date);
                    setTimeout(handleFilterChange, 100);
                  }}
                  placeholder="From date"
                />
              </div>

              <div className="flex-shrink-0">
                <DatePicker
                  value={dateTo}
                  onChange={(date) => {
                    setDateTo(date);
                    setTimeout(handleFilterChange, 100);
                  }}
                  placeholder="To date"
                />
              </div>

              <Button variant="outline" onClick={clearFilters} className="flex-shrink-0 whitespace-nowrap">
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="unposted">Unposted ({stats.unposted})</TabsTrigger>
              <TabsTrigger value="posted">Posted ({stats.posted})</TabsTrigger>
              <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({stats.paid})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {/* Selection Summary */}
              {selectedInvoices.size > 0 && (
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">
                        {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? "s" : ""} selected
                      </div>
                      <div className="text-sm text-muted-foreground">Total: {formatCurrency(stats.selectedAmount)}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedInvoices(new Set())}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}

              {/* Invoice Table */}
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchTerm || selectedCustomerId || selectedStatus || dateFrom || dateTo ? "No invoices found matching your criteria." : "No invoices found."}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0} onCheckedChange={handleSelectAll} />
                        </TableHead>
                        <TableHead className="w-[160px]">Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Property/Unit</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.LeaseInvoiceID}>
                          <TableCell>
                            <Checkbox
                              checked={selectedInvoices.has(invoice.LeaseInvoiceID)}
                              onCheckedChange={(checked) => handleSelectInvoice(invoice.LeaseInvoiceID, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{invoice.InvoiceNo}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(invoice.InvoiceDate)}
                            </div>
                            {invoice.IsOverdue && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {invoice.DaysOverdue} days overdue
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{invoice.CustomerName}</div>
                                <div className="text-sm text-muted-foreground">{invoice.CustomerNo}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{invoice.PropertyName}</div>
                                <div className="text-sm text-muted-foreground">Unit: {invoice.UnitNo}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>
                                <span className="font-medium">Due:</span> {formatDate(invoice.DueDate)}
                              </div>
                              {invoice.PeriodFromDate && invoice.PeriodToDate && (
                                <div className="text-muted-foreground">
                                  Period: {formatDate(invoice.PeriodFromDate)} - {formatDate(invoice.PeriodToDate)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(invoice.TotalAmount)}</div>
                            <div className="text-sm text-muted-foreground">Paid: {formatCurrency(invoice.PaidAmount)}</div>
                            {invoice.BalanceAmount > 0 && <div className="text-sm text-red-600">Balance: {formatCurrency(invoice.BalanceAmount)}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {renderStatusBadge(invoice.InvoiceStatus)}
                              {invoice.IsPosted && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Posted
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{invoice.InvoiceType}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                {!invoice.IsPosted && (
                                  <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {!invoice.IsPosted && (
                                  <DropdownMenuItem onClick={() => openPostingDialog(invoice)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Post
                                  </DropdownMenuItem>
                                )}
                                {invoice.BalanceAmount > 0 && (
                                  <DropdownMenuItem onClick={() => openPaymentDialog(invoice)}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Record Payment
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="font-medium text-muted-foreground">Change Status</DropdownMenuLabel>

                                {invoiceStatusOptions
                                  .filter((status) => status !== invoice.InvoiceStatus)
                                  .map((status) => (
                                    <DropdownMenuItem key={status} onClick={() => openStatusChangeDialog(invoice, status)}>
                                      Set as {status}
                                    </DropdownMenuItem>
                                  ))}

                                <DropdownMenuSeparator />

                                {!invoice.IsPosted && (
                                  <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(invoice)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
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
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
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
        loading={actionLoading}
      />

      {/* Status Change Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={statusChangeDialogOpen}
        onClose={() => setStatusChangeDialogOpen(false)}
        onConfirm={handleStatusChange}
        title="Change Invoice Status"
        description={
          selectedInvoice && newStatus
            ? `Are you sure you want to change the status of invoice "${selectedInvoice.InvoiceNo}" to "${newStatus}"?`
            : "Are you sure you want to change this invoice status?"
        }
        cancelText="Cancel"
        confirmText="Change Status"
        type="warning"
        loading={actionLoading}
      />

      {/* Payment Recording Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice {selectedInvoice?.InvoiceNo}
              <br />
              Outstanding balance: {formatCurrency(selectedInvoice?.BalanceAmount)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={paymentForm.handleSubmit(handleRecordPayment)} className="space-y-4">
            <FormField
              form={paymentForm}
              name="paymentAmount"
              label="Payment Amount"
              type="number"
              step="0.01"
              placeholder="Enter payment amount"
              required
              description="Amount being paid"
            />
            <FormField form={paymentForm} name="paymentDate" label="Payment Date" type="date" required description="Date payment was received" />
            <FormField
              form={paymentForm}
              name="paymentMethod"
              label="Payment Method"
              type="select"
              options={paymentMethodOptions.map((method) => ({
                label: method,
                value: method,
              }))}
              required
              description="Method of payment"
            />
            <FormField form={paymentForm} name="paymentReference" label="Reference Number" placeholder="Check number, transaction ID, etc." description="Payment reference" />
            <FormField form={paymentForm} name="notes" label="Notes" type="textarea" placeholder="Additional notes" description="Optional payment notes" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Record Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Single Invoice Posting Dialog */}
      <Dialog open={postingDialogOpen} onOpenChange={setPostingDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Post Invoice</DialogTitle>
            <DialogDescription>
              Post invoice {selectedInvoice?.InvoiceNo} to the general ledger
              <br />
              Amount: {formatCurrency(selectedInvoice?.TotalAmount)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={postingForm.handleSubmit(handlePostInvoice)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField form={postingForm} name="postingDate" label="Posting Date" type="date" required description="Date for the posting entries" />
              <FormField
                form={postingForm}
                name="exchangeRate"
                label="Exchange Rate"
                type="number"
                step="0.0001"
                placeholder="1.0000"
                description="Exchange rate to base currency"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                form={postingForm}
                name="debitAccountId"
                label="Debit Account"
                type="select"
                options={accounts
                  .filter((acc) => acc.AccountCode.startsWith("1"))
                  .map((account) => ({
                    label: `${account.AccountCode} - ${account.AccountName}`,
                    value: account.AccountID.toString(),
                  }))}
                placeholder="Select debit account"
                required
                description="Account to debit (typically Accounts Receivable)"
              />
              <FormField
                form={postingForm}
                name="creditAccountId"
                label="Credit Account"
                type="select"
                options={accounts
                  .filter((acc) => acc.AccountCode.startsWith("4"))
                  .map((account) => ({
                    label: `${account.AccountCode} - ${account.AccountName}`,
                    value: account.AccountID.toString(),
                  }))}
                placeholder="Select credit account"
                required
                description="Account to credit (typically Revenue account)"
              />
            </div>
            <FormField
              form={postingForm}
              name="narration"
              label="Narration"
              type="textarea"
              placeholder="Enter posting narration"
              description="Description for the posting entries"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPostingDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post Invoice
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Posting Dialog */}
      <Dialog open={bulkPostingDialogOpen} onOpenChange={setBulkPostingDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Bulk Post Invoices</DialogTitle>
            <DialogDescription>
              Post {selectedInvoices.size} selected invoices to the general ledger
              <br />
              Total Amount: {formatCurrency(stats.selectedAmount)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={postingForm.handleSubmit(handleBulkPost)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField form={postingForm} name="postingDate" label="Posting Date" type="date" required description="Date for all posting entries" />
              <FormField
                form={postingForm}
                name="exchangeRate"
                label="Exchange Rate"
                type="number"
                step="0.0001"
                placeholder="1.0000"
                description="Exchange rate to base currency"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                form={postingForm}
                name="debitAccountId"
                label="Debit Account"
                type="select"
                options={accounts
                  .filter((acc) => acc.AccountCode.startsWith("1"))
                  .map((account) => ({
                    label: `${account.AccountCode} - ${account.AccountName}`,
                    value: account.AccountID.toString(),
                  }))}
                placeholder="Select debit account"
                required
                description="Account to debit for all invoices"
              />
              <FormField
                form={postingForm}
                name="creditAccountId"
                label="Credit Account"
                type="select"
                options={accounts
                  .filter((acc) => acc.AccountCode.startsWith("4"))
                  .map((account) => ({
                    label: `${account.AccountCode} - ${account.AccountName}`,
                    value: account.AccountID.toString(),
                  }))}
                placeholder="Select credit account"
                required
                description="Account to credit for all invoices"
              />
            </div>
            <FormField
              form={postingForm}
              name="narration"
              label="Narration"
              type="textarea"
              placeholder="Enter posting narration"
              description="Description for all posting entries"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBulkPostingDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post {selectedInvoices.size} Invoices
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractInvoiceList;
