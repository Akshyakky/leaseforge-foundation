// src/pages/contractInvoice/ContractInvoiceList.tsx - Updated with Comprehensive Approval System
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  HandCoins,
  Send,
  CreditCard,
  RefreshCw,
  Download,
  Filter,
  Users,
  Receipt,
  ChevronDown,
  Lock,
  Shield,
  UserCheck,
  RotateCcw,
  AlertTriangle,
  X,
  SortAsc,
  SortDesc,
  ArrowUpDown,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Form } from "@/components/ui/form";
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
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";
import {
  ContractInvoice,
  InvoiceSearchParams,
  InvoiceStatistics,
  InvoicePostingRequest,
  BulkInvoicePostingRequest,
  SelectedInvoiceForPosting,
  InvoicePaymentRequest,
  InvoiceApprovalRequest,
  InvoiceRejectionRequest,
} from "@/types/contractInvoiceTypes";
import { PdfPreviewModal } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

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

// Types and interfaces
interface InvoiceFilter {
  searchTerm: string;
  selectedCustomerId: string;
  selectedPropertyId: string;
  selectedStatus: string;
  selectedApprovalStatus: string;
  selectedType: string;
  dateFrom?: Date;
  dateTo?: Date;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  showPostedOnly?: boolean;
  showOverdueOnly?: boolean;
}

interface SortConfig {
  key: keyof ContractInvoice | null;
  direction: "asc" | "desc";
}

interface InvoiceListStats {
  total: number;
  unposted: number;
  posted: number;
  overdue: number;
  paid: number;
  totalAmount: number;
  outstandingAmount: number;
  selectedCount: number;
  selectedAmount: number;
  approvalPending: number;
  approvalApproved: number;
  approvalRejected: number;
  approvedProtected: number;
}

const ContractInvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [invoices, setInvoices] = useState<ContractInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<ContractInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  // Approval dialog states
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [bulkApprovalDialogOpen, setBulkApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkApprovalLoading, setBulkApprovalLoading] = useState(false);

  // Selected items for actions
  const [selectedInvoice, setSelectedInvoice] = useState<ContractInvoice | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  // Filter and sort state
  const [filters, setFilters] = useState<InvoiceFilter>({
    searchTerm: searchParams.get("search") || "",
    selectedCustomerId: searchParams.get("customer") || "",
    selectedPropertyId: searchParams.get("property") || "",
    selectedStatus: searchParams.get("status") || "",
    selectedApprovalStatus: searchParams.get("approval") || "",
    selectedType: searchParams.get("type") || "",
    dateFrom: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    dateTo: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
    dueDateFrom: searchParams.get("dueFrom") ? new Date(searchParams.get("dueFrom")!) : undefined,
    dueDateTo: searchParams.get("dueTo") ? new Date(searchParams.get("dueTo")!) : undefined,
    showPostedOnly: searchParams.get("posted") === "true",
    showOverdueOnly: searchParams.get("overdue") === "true",
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  // Statistics
  const [statistics, setStatistics] = useState<InvoiceStatistics>({
    statusCounts: [],
    approvalStatusCounts: [],
    overdueInvoices: { OverdueCount: 0, OverdueAmount: 0, AvgDaysOverdue: 0 },
    monthlyTrends: [],
  });

  // Active tab
  const [activeTab, setActiveTab] = useState("all");

  // PDF functionality
  const [showInvoiceListPdfPreview, setShowInvoiceListPdfPreview] = useState(false);
  const invoiceListPdf = useGenericPdfReport();

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
  const invoiceStatusOptions = ["Draft", "Pending", "Active", "Paid", "Cancelled", "Voided"];
  const approvalStatusOptions = ["Pending", "Approved", "Rejected"];
  const invoiceTypeOptions = ["Rent", "Security Deposit", "Admin Fee", "Utilities", "Maintenance", "Custom"];
  const paymentMethodOptions = ["Cash", "Cheque", "Bank Transfer", "Credit Card", "Online"];

  // Check if user is manager
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Initialize data on component mount
  useEffect(() => {
    initializeData();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchTerm) params.set("search", filters.searchTerm);
    if (filters.selectedCustomerId) params.set("customer", filters.selectedCustomerId);
    if (filters.selectedPropertyId) params.set("property", filters.selectedPropertyId);
    if (filters.selectedStatus) params.set("status", filters.selectedStatus);
    if (filters.selectedApprovalStatus) params.set("approval", filters.selectedApprovalStatus);
    if (filters.selectedType) params.set("type", filters.selectedType);
    if (filters.dateFrom) params.set("from", filters.dateFrom.toISOString().split("T")[0]);
    if (filters.dateTo) params.set("to", filters.dateTo.toISOString().split("T")[0]);
    if (filters.dueDateFrom) params.set("dueFrom", filters.dueDateFrom.toISOString().split("T")[0]);
    if (filters.dueDateTo) params.set("dueTo", filters.dueDateTo.toISOString().split("T")[0]);
    if (filters.showPostedOnly) params.set("posted", "true");
    if (filters.showOverdueOnly) params.set("overdue", "true");

    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Apply filters and sorting whenever invoices or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [invoices, filters, sortConfig]);

  // Initialize component data
  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchInvoices(), fetchReferenceData(), fetchStatistics()]);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data functions
  const fetchInvoices = async () => {
    try {
      const invoicesData = await contractInvoiceService.getAllInvoices();
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    }
  };

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

  const fetchStatistics = async () => {
    try {
      const stats = await contractInvoiceService.getInvoiceStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchInvoices(), fetchStatistics()]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...invoices];

    // Apply text search
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.InvoiceNo?.toLowerCase().includes(searchLower) ||
          invoice.CustomerName?.toLowerCase().includes(searchLower) ||
          invoice.ContractNo?.toLowerCase().includes(searchLower) ||
          invoice.PropertyName?.toLowerCase().includes(searchLower) ||
          invoice.UnitNo?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filters.selectedCustomerId) {
      filtered = filtered.filter((invoice) => invoice.CustomerID?.toString() === filters.selectedCustomerId);
    }

    if (filters.selectedPropertyId) {
      filtered = filtered.filter((invoice) => invoice.PropertyName === properties.find((p) => p.PropertyID.toString() === filters.selectedPropertyId)?.PropertyName);
    }

    if (filters.selectedStatus) {
      filtered = filtered.filter((invoice) => invoice.InvoiceStatus === filters.selectedStatus);
    }

    if (filters.selectedApprovalStatus) {
      filtered = filtered.filter((invoice) => invoice.ApprovalStatus === filters.selectedApprovalStatus);
    }

    if (filters.selectedType) {
      filtered = filtered.filter((invoice) => invoice.InvoiceType === filters.selectedType);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((invoice) => new Date(invoice.InvoiceDate) >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((invoice) => new Date(invoice.InvoiceDate) <= filters.dateTo!);
    }

    if (filters.dueDateFrom) {
      filtered = filtered.filter((invoice) => new Date(invoice.DueDate) >= filters.dueDateFrom!);
    }

    if (filters.dueDateTo) {
      filtered = filtered.filter((invoice) => new Date(invoice.DueDate) <= filters.dueDateTo!);
    }

    if (filters.showPostedOnly) {
      filtered = filtered.filter((invoice) => invoice.IsPosted);
    }

    if (filters.showOverdueOnly) {
      filtered = filtered.filter((invoice) => invoice.IsOverdue);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    setFilteredInvoices(filtered);
  }, [invoices, filters, sortConfig, properties]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters((prev) => ({ ...prev, searchTerm: value }));
      }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof InvoiceFilter, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      selectedCustomerId: "",
      selectedPropertyId: "",
      selectedStatus: "",
      selectedApprovalStatus: "",
      selectedType: "",
      dateFrom: undefined,
      dateTo: undefined,
      dueDateFrom: undefined,
      dueDateTo: undefined,
      showPostedOnly: undefined,
      showOverdueOnly: undefined,
    });
    setSearchParams(new URLSearchParams());
    setSelectedInvoices(new Set());
  };

  // Handle sorting
  const handleSort = (key: keyof ContractInvoice) => {
    setSortConfig((prevSort) => ({
      key,
      direction: prevSort.key === key && prevSort.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Check if invoice can be edited
  const canEditInvoice = (invoice: ContractInvoice) => {
    return invoice.ApprovalStatus !== "Approved";
  };

  // Get filtered invoices based on active tab
  const getFilteredInvoices = () => {
    switch (activeTab) {
      case "unposted":
        return filteredInvoices.filter((inv) => !inv.IsPosted);
      case "posted":
        return filteredInvoices.filter((inv) => inv.IsPosted);
      case "overdue":
        return filteredInvoices.filter((inv) => inv.IsOverdue);
      case "paid":
        return filteredInvoices.filter((inv) => inv.InvoiceStatus === "Paid");
      case "pending-approval":
        return filteredInvoices.filter((inv) => inv.ApprovalStatus === "Pending");
      case "approved":
        return filteredInvoices.filter((inv) => inv.ApprovalStatus === "Approved");
      default:
        return filteredInvoices;
    }
  };

  // Navigation handlers
  const handleCreateInvoice = () => {
    navigate("/invoices/new");
  };

  const handleViewInvoice = (invoice: ContractInvoice) => {
    navigate(`/invoices/${invoice.LeaseInvoiceID}`);
  };

  const handleEditInvoice = (invoice: ContractInvoice) => {
    if (!canEditInvoice(invoice)) {
      toast.error("Cannot edit approved invoices. Please reset approval status first if changes are needed.");
      return;
    }
    navigate(`/invoices/edit/${invoice.LeaseInvoiceID}`);
  };

  // Analytics navigation
  const handleViewPendingApprovals = () => {
    setFilters((prev) => ({ ...prev, selectedApprovalStatus: "Pending" }));
    setActiveTab("pending-approval");
    setShowFilters(true);
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
      const currentInvoices = getFilteredInvoices();
      setSelectedInvoices(new Set(currentInvoices.map((inv) => inv.LeaseInvoiceID)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  // Approval handlers for individual invoices
  const handleApproveInvoice = async (invoice: ContractInvoice) => {
    if (!isManager) return;

    try {
      setActionLoading(true);
      const response = await contractInvoiceService.approveInvoice({ invoiceId: invoice.LeaseInvoiceID });

      if (response.Status === 1) {
        setInvoices(invoices.map((inv) => (inv.LeaseInvoiceID === invoice.LeaseInvoiceID ? { ...inv, ApprovalStatus: "Approved" } : inv)));
        toast.success("Invoice approved successfully");
      } else {
        toast.error(response.Message || "Failed to approve invoice");
      }
    } catch (error) {
      console.error("Error approving invoice:", error);
      toast.error("Failed to approve invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectInvoice = async (invoice: ContractInvoice) => {
    if (!isManager) return;

    try {
      setActionLoading(true);
      const response = await contractInvoiceService.rejectInvoice({
        invoiceId: invoice.LeaseInvoiceID,
        rejectionReason: "Quick rejection from list",
      });

      if (response.Status === 1) {
        setInvoices(invoices.map((inv) => (inv.LeaseInvoiceID === invoice.LeaseInvoiceID ? { ...inv, ApprovalStatus: "Rejected" } : inv)));
        toast.success("Invoice rejected successfully");
      } else {
        toast.error(response.Message || "Failed to reject invoice");
      }
    } catch (error) {
      console.error("Error rejecting invoice:", error);
      toast.error("Failed to reject invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetApprovalStatus = async (invoice: ContractInvoice) => {
    if (!isManager) return;

    try {
      setActionLoading(true);
      const response = await contractInvoiceService.resetApprovalStatus(invoice.LeaseInvoiceID);

      if (response.Status === 1) {
        setInvoices(invoices.map((inv) => (inv.LeaseInvoiceID === invoice.LeaseInvoiceID ? { ...inv, ApprovalStatus: "Pending" } : inv)));
        toast.success("Approval status reset successfully");
      } else {
        toast.error(response.Message || "Failed to reset approval status");
      }
    } catch (error) {
      console.error("Error resetting approval status:", error);
      toast.error("Failed to reset approval status");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk approval operations
  const handleBulkApproval = async (action: "approve" | "reject") => {
    if (!isManager || selectedInvoices.size === 0) return;

    const pendingInvoices = Array.from(selectedInvoices).filter((invoiceId) => {
      const invoice = invoices.find((inv) => inv.LeaseInvoiceID === invoiceId);
      return invoice?.ApprovalStatus === "Pending";
    });

    if (pendingInvoices.length === 0) {
      toast.error("No pending invoices selected for approval action");
      return;
    }

    setBulkApprovalLoading(true);

    try {
      if (action === "approve") {
        const response = await contractInvoiceService.bulkApproveInvoices({
          invoiceIds: pendingInvoices,
          approvalComments: approvalComments,
        });

        if (response.Status === 1) {
          setInvoices(invoices.map((inv) => (pendingInvoices.includes(inv.LeaseInvoiceID) ? { ...inv, ApprovalStatus: "Approved" } : inv)));
          toast.success(`${pendingInvoices.length} invoices approved successfully`);
        } else {
          toast.error(response.Message || "Failed to approve invoices");
        }
      } else {
        const response = await contractInvoiceService.bulkRejectInvoices({
          invoiceIds: pendingInvoices,
          rejectionReason: rejectionReason,
        });

        if (response.Status === 1) {
          setInvoices(invoices.map((inv) => (pendingInvoices.includes(inv.LeaseInvoiceID) ? { ...inv, ApprovalStatus: "Rejected" } : inv)));
          toast.success(`${pendingInvoices.length} invoices rejected successfully`);
        } else {
          toast.error(response.Message || "Failed to reject invoices");
        }
      }

      setSelectedInvoices(new Set());
    } catch (error) {
      toast.error(`Failed to ${action} invoices`);
    } finally {
      setBulkApprovalLoading(false);
      setBulkApprovalDialogOpen(false);
      setApprovalComments("");
      setRejectionReason("");
    }
  };

  // Status change handlers
  const openStatusChangeDialog = (invoice: ContractInvoice, status: string) => {
    if (!canEditInvoice(invoice)) {
      toast.error("Cannot change status of approved invoices. Please reset approval status first if changes are needed.");
      return;
    }
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
    if (!canEditInvoice(invoice)) {
      toast.error("Cannot delete approved invoices. Please reset approval status first if deletion is needed.");
      return;
    }
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

    // Filter out approved and unposted invoices
    const eligibleInvoices = Array.from(selectedInvoices)
      .map((id) => invoices.find((inv) => inv.LeaseInvoiceID === id))
      .filter((invoice) => invoice && invoice.ApprovalStatus === "Approved" && !invoice.IsPosted) as ContractInvoice[];

    if (eligibleInvoices.length === 0) {
      toast.error("No eligible invoices selected for posting. Only approved and unposted invoices can be posted.");
      return;
    }

    try {
      setActionLoading(true);
      const selectedForPosting: SelectedInvoiceForPosting[] = eligibleInvoices.map((invoice) => ({
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
        setInvoices(invoices.map((inv) => (selectedInvoices.has(inv.LeaseInvoiceID) && eligibleInvoices.includes(inv) ? { ...inv, IsPosted: true } : inv)));
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

  // PDF functionality
  const filterEmptyParameters = (params: any) => {
    const filtered: any = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "" && value !== 0) {
        filtered[key] = value;
      }
    });
    return filtered;
  };

  const handleGenerateInvoiceListReport = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : null,
      FilterInvoiceStatus: filters.selectedStatus || "",
      FilterApprovalStatus: filters.selectedApprovalStatus || "",
      FilterInvoiceType: filters.selectedType || "",
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
      FilterDueDateFrom: filters.dueDateFrom,
      FilterDueDateTo: filters.dueDateTo,
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterPostedOnly: filters.showPostedOnly,
      FilterOverdueOnly: filters.showOverdueOnly,
    };

    const filteredParameters = filterEmptyParameters(parameters);

    const response = await invoiceListPdf.generateReport("invoice-list", filteredParameters, {
      orientation: "Landscape",
      download: true,
      showToast: true,
      filename: `Invoice_List_${new Date().toISOString().split("T")[0]}.pdf`,
    });

    if (response.success) {
      toast.success("Invoice list report generated successfully");
    }
  };

  const handlePreviewInvoiceListReport = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : null,
      FilterInvoiceStatus: filters.selectedStatus || "",
      FilterApprovalStatus: filters.selectedApprovalStatus || "",
      FilterInvoiceType: filters.selectedType || "",
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
      FilterDueDateFrom: filters.dueDateFrom,
      FilterDueDateTo: filters.dueDateTo,
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterPostedOnly: filters.showPostedOnly,
      FilterOverdueOnly: filters.showOverdueOnly,
    };

    const filteredParameters = filterEmptyParameters(parameters);

    setShowInvoiceListPdfPreview(true);

    const response = await invoiceListPdf.generateReport("invoice-list", filteredParameters, {
      orientation: "Landscape",
      download: false,
      showToast: false,
    });

    if (!response.success) {
      toast.error("Failed to generate invoice list preview");
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: {
        variant: "secondary" as const,
        icon: FileText,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
      Pending: {
        variant: "default" as const,
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      },
      Approved: {
        variant: "default" as const,
        icon: CheckCircle,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      },
      Active: {
        variant: "default" as const,
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      },
      Paid: {
        variant: "default" as const,
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      },
      Cancelled: {
        variant: "destructive" as const,
        icon: XCircle,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      },
      Voided: {
        variant: "destructive" as const,
        icon: XCircle,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      },
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

  // Render approval status badge
  // Current problematic code
  const renderApprovalBadge = (status: string) => {
    const approvalConfig = {
      Pending: {
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      },
      Approved: {
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      },
      Rejected: {
        icon: XCircle,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      },
    };

    const config = approvalConfig[status as keyof typeof approvalConfig] || approvalConfig.Pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
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
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate statistics
  const currentInvoices = getFilteredInvoices();
  const stats: InvoiceListStats = useMemo(() => {
    return {
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
      approvalPending: invoices.filter((inv) => inv.ApprovalStatus === "Pending").length,
      approvalApproved: invoices.filter((inv) => inv.ApprovalStatus === "Approved").length,
      approvalRejected: invoices.filter((inv) => inv.ApprovalStatus === "Rejected").length,
      approvedProtected: invoices.filter((inv) => inv.ApprovalStatus === "Approved").length,
    };
  }, [invoices, selectedInvoices]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm ||
    filters.selectedCustomerId ||
    filters.selectedPropertyId ||
    filters.selectedStatus ||
    filters.selectedApprovalStatus ||
    filters.selectedType ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.dueDateFrom ||
    filters.dueDateTo ||
    filters.showPostedOnly ||
    filters.showOverdueOnly;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Contract Invoice Management</h1>
            <p className="text-muted-foreground">Manage lease invoices, approvals, and revenue posting</p>
          </div>
          <div className="flex items-center gap-2">
            {isManager && stats.approvalPending > 0 && (
              <Button
                variant="outline"
                onClick={handleViewPendingApprovals}
                className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300"
              >
                <Shield className="mr-2 h-4 w-4" />
                {stats.approvalPending} Pending Approval{stats.approvalPending !== 1 ? "s" : ""}
              </Button>
            )}
            {stats.approvedProtected > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                    <Lock className="mr-2 h-4 w-4" />
                    {stats.approvedProtected} Protected
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.approvedProtected} approved invoices are protected from modifications</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button onClick={handleCreateInvoice}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Contract Invoices</CardTitle>
            <CardDescription>
              {hasActiveFilters ? `Showing ${currentInvoices.length} of ${invoices.length} invoices` : `Showing all ${invoices.length} invoices`}
              {stats.approvedProtected > 0 && <span className="ml-2 text-green-600">• {stats.approvedProtected} approved invoices are protected from modifications</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">{hasActiveFilters ? `of ${invoices.length} total` : "invoices"}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-muted-foreground">Unposted</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.unposted}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Posted</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.posted}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-muted-foreground">Overdue</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-muted-foreground">Paid</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.paid}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <HandCoins className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-muted-foreground">Outstanding</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(stats.outstandingAmount)}</div>
                </CardContent>
              </Card>

              {isManager && (
                <>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-muted-foreground">Approval Pending</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.approvalPending}</div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">Approved</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approvalApproved}</div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">Protected</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approvedProtected}</div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-muted-foreground">Rejected</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.approvalRejected}</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search invoices..." className="pl-9" defaultValue={filters.searchTerm} onChange={handleSearchChange} />
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <Select value={filters.selectedCustomerId || "all"} onValueChange={(value) => handleFilterChange("selectedCustomerId", value === "all" ? "" : value)}>
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

                <Select value={filters.selectedPropertyId || "all"} onValueChange={(value) => handleFilterChange("selectedPropertyId", value === "all" ? "" : value)}>
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

                <Select value={filters.selectedStatus || "all"} onValueChange={(value) => handleFilterChange("selectedStatus", value === "all" ? "" : value)}>
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

                <Select value={filters.selectedApprovalStatus || "all"} onValueChange={(value) => handleFilterChange("selectedApprovalStatus", value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[140px] flex-shrink-0">
                    <SelectValue placeholder="Approval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Approval Status</SelectItem>
                    {approvalStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.selectedType || "all"} onValueChange={(value) => handleFilterChange("selectedType", value === "all" ? "" : value)}>
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
                  <DatePicker value={filters.dateFrom} onChange={(date) => handleFilterChange("dateFrom", date)} placeholder="From date" />
                </div>

                <div className="flex-shrink-0">
                  <DatePicker value={filters.dateTo} onChange={(date) => handleFilterChange("dateTo", date)} placeholder="To date" />
                </div>

                <Button variant="outline" onClick={clearFilters} className="flex-shrink-0 whitespace-nowrap">
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-4">
                <TabsList className="grid w-full grid-cols-7 max-w-[900px]">
                  <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                  <TabsTrigger value="unposted">Unposted ({stats.unposted})</TabsTrigger>
                  <TabsTrigger value="posted">Posted ({stats.posted})</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
                  <TabsTrigger value="paid">Paid ({stats.paid})</TabsTrigger>
                  {isManager && <TabsTrigger value="pending-approval">Pending ({stats.approvalPending})</TabsTrigger>}
                  {isManager && <TabsTrigger value="approved">Approved ({stats.approvalApproved})</TabsTrigger>}
                </TabsList>

                <div className="flex items-center gap-2">
                  {/* PDF Generation */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" disabled={invoiceListPdf.isLoading}>
                        {invoiceListPdf.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handlePreviewInvoiceListReport}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleGenerateInvoiceListReport}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Bulk Operations */}
                  {selectedInvoices.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          Bulk Actions ({selectedInvoices.size})
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setBulkPostingDialogOpen(true)}>
                          <Send className="mr-2 h-4 w-4" />
                          Post Selected
                        </DropdownMenuItem>

                        {isManager && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Approval Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setApprovalAction("approve");
                                setBulkApprovalDialogOpen(true);
                              }}
                              disabled={bulkApprovalLoading}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Approve Selected
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setApprovalAction("reject");
                                setBulkApprovalDialogOpen(true);
                              }}
                              disabled={bulkApprovalLoading}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Reject Selected
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

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
                {currentInvoices.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">{hasActiveFilters ? "No invoices found matching your criteria." : "No invoices found."}</div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox checked={selectedInvoices.size === currentInvoices.length && currentInvoices.length > 0} onCheckedChange={handleSelectAll} />
                          </TableHead>
                          <TableHead className="w-[160px] cursor-pointer" onClick={() => handleSort("InvoiceNo")}>
                            <div className="flex items-center gap-1">
                              Invoice #
                              {sortConfig.key === "InvoiceNo" ? (
                                sortConfig.direction === "asc" ? (
                                  <SortAsc className="h-4 w-4" />
                                ) : (
                                  <SortDesc className="h-4 w-4" />
                                )
                              ) : (
                                <ArrowUpDown className="h-4 w-4 opacity-50" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Property/Unit</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Approval</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentInvoices.map((invoice) => {
                          const isApproved = invoice.ApprovalStatus === "Approved";
                          const canEdit = canEditInvoice(invoice);

                          return (
                            <TableRow
                              key={invoice.LeaseInvoiceID}
                              className={cn(
                                "hover:bg-muted/50 transition-colors",
                                selectedInvoices.has(invoice.LeaseInvoiceID) && "bg-accent/50",
                                isApproved && "bg-green-50/30 dark:bg-green-900/20"
                              )}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedInvoices.has(invoice.LeaseInvoiceID)}
                                  onCheckedChange={(checked) => handleSelectInvoice(invoice.LeaseInvoiceID, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
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
                                  </div>
                                  {isApproved && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Lock className="h-3 w-3 text-green-600" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Protected - Approved invoices cannot be modified</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
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
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Posted
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {invoice.RequiresApproval ? (
                                    renderApprovalBadge(invoice.ApprovalStatus)
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                                      No Approval Required
                                    </Badge>
                                  )}
                                  {isApproved && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Shield className="h-3 w-3 text-green-600 ml-1" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Protected from modifications</p>
                                      </TooltipContent>
                                    </Tooltip>
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

                                    {canEdit ? (
                                      <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                    ) : (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div>
                                            <DropdownMenuItem disabled>
                                              <Lock className="mr-2 h-4 w-4" />
                                              Edit (Protected)
                                            </DropdownMenuItem>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Cannot edit approved invoices</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}

                                    {!invoice.IsPosted && canEdit && (
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

                                    {isManager && invoice.RequiresApproval && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="font-medium text-muted-foreground">Approval Actions</DropdownMenuLabel>

                                        {invoice.ApprovalStatus === "Pending" && (
                                          <>
                                            <DropdownMenuItem onClick={() => handleApproveInvoice(invoice)}>
                                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                              Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRejectInvoice(invoice)}>
                                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                              Reject
                                            </DropdownMenuItem>
                                          </>
                                        )}

                                        {invoice.ApprovalStatus !== "Pending" && (
                                          <DropdownMenuItem onClick={() => handleResetApprovalStatus(invoice)}>
                                            <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                                            Reset Approval
                                          </DropdownMenuItem>
                                        )}
                                      </>
                                    )}

                                    <DropdownMenuSeparator />

                                    <DropdownMenuLabel className="font-medium text-muted-foreground">Change Status</DropdownMenuLabel>

                                    {invoiceStatusOptions
                                      .filter((status) => status !== invoice.InvoiceStatus)
                                      .map((status) => (
                                        <DropdownMenuItem key={status} onClick={() => openStatusChangeDialog(invoice, status)} disabled={!canEdit}>
                                          {canEdit ? (
                                            <>Set as {status}</>
                                          ) : (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center w-full">
                                                  <Lock className="mr-2 h-4 w-4" />
                                                  Set as {status} (Protected)
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Cannot change status of approved invoices</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                        </DropdownMenuItem>
                                      ))}

                                    <DropdownMenuSeparator />

                                    {canEdit ? (
                                      <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(invoice)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    ) : (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div>
                                            <DropdownMenuItem disabled>
                                              <Lock className="mr-2 h-4 w-4" />
                                              Delete (Protected)
                                            </DropdownMenuItem>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Cannot delete approved invoices</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={showInvoiceListPdfPreview}
          onClose={() => setShowInvoiceListPdfPreview(false)}
          pdfBlob={invoiceListPdf.data}
          title="Invoice List Report"
          isLoading={invoiceListPdf.isLoading}
          error={invoiceListPdf.error}
          onDownload={() => invoiceListPdf.downloadCurrentPdf("Invoice_List_Report.pdf")}
          onRefresh={handlePreviewInvoiceListReport}
        />

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
            <Form {...paymentForm}>
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
            </Form>
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
            <Form {...postingForm}>
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
            </Form>
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
            <Form {...postingForm}>
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
            </Form>
          </DialogContent>
        </Dialog>

        {/* Bulk Approval Dialog */}
        <Dialog open={bulkApprovalDialogOpen} onOpenChange={setBulkApprovalDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{approvalAction === "approve" ? "Bulk Approve Invoices" : "Bulk Reject Invoices"}</DialogTitle>
              <DialogDescription>
                {approvalAction === "approve"
                  ? `Approve ${selectedInvoices.size} selected invoices. Note: Once approved, invoices will be protected from modifications.`
                  : `Reject ${selectedInvoices.size} selected invoices with a reason.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {approvalAction === "approve" && (
                <div className="space-y-2">
                  <Label htmlFor="bulkApprovalComments">Approval Comments (Optional)</Label>
                  <Textarea
                    id="bulkApprovalComments"
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Enter any comments about the approval"
                    rows={3}
                  />
                </div>
              )}
              {approvalAction === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="bulkRejectionReason">Rejection Reason *</Label>
                  <Textarea
                    id="bulkRejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejection"
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkApprovalDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleBulkApproval(approvalAction)}
                disabled={bulkApprovalLoading || (approvalAction === "reject" && !rejectionReason.trim())}
                variant={approvalAction === "reject" ? "destructive" : "default"}
              >
                {bulkApprovalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {approvalAction === "approve" && <CheckCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === "reject" && <XCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === "approve" ? "Approve" : "Reject"} {selectedInvoices.size} Invoices
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ContractInvoiceList;
