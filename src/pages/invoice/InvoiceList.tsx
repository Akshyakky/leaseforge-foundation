// src/pages/invoice/InvoiceList.tsx - Enhanced with comprehensive PDF generation
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  MoreHorizontal,
  Search,
  Plus,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Receipt,
  Eye,
  History,
  RefreshCw,
  Download,
  Filter,
  X,
  ChevronDown,
  BarChart3,
  TrendingUp,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Edit,
  Trash2,
  Send,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { invoiceService, LeaseInvoice } from "@/services/invoiceService";
import { receiptService, PaymentStatus } from "@/services/receiptService";
import { customerService } from "@/services/customerService";
import { contractService } from "@/services/contractService";
import { propertyService } from "@/services/propertyService";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// PDF Report Components
import { PdfPreviewModal, PdfActionButtons } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

// Enhanced interface for invoice with payment information
interface InvoiceWithPaymentInfo extends LeaseInvoice {
  hasReceipts?: boolean;
  pendingReceipts?: number;
  lastPaymentDate?: string;
  paymentProgress?: number;
}

// Filter interface
interface InvoiceFilter {
  searchTerm: string;
  selectedCustomerId: string;
  selectedContractId: string;
  selectedInvoiceStatus: string;
  selectedInvoiceType: string;
  selectedPropertyId: string;
  dateFrom?: Date;
  dateTo?: Date;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  postedOnly?: boolean;
  unpostedOnly?: boolean;
  overdueOnly?: boolean;
}

// Sort configuration
interface SortConfig {
  key: keyof LeaseInvoice | null;
  direction: "asc" | "desc";
}

// Statistics interface
interface InvoiceListStats {
  total: number;
  draft: number;
  pending: number;
  sent: number;
  partial: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalValue: number;
  totalPaid: number;
  totalBalance: number;
  averageValue: number;
  overdueAmount: number;
}

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State variables
  const [invoices, setInvoices] = useState<InvoiceWithPaymentInfo[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithPaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithPaymentInfo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("all");

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  // Filter and sort state
  const [filters, setFilters] = useState<InvoiceFilter>({
    searchTerm: searchParams.get("search") || "",
    selectedCustomerId: searchParams.get("customerId") || "",
    selectedContractId: searchParams.get("contractId") || "",
    selectedInvoiceStatus: searchParams.get("status") || "",
    selectedInvoiceType: searchParams.get("type") || "",
    selectedPropertyId: searchParams.get("propertyId") || "",
    dateFrom: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    dateTo: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
    dueDateFrom: searchParams.get("dueFrom") ? new Date(searchParams.get("dueFrom")!) : undefined,
    dueDateTo: searchParams.get("dueTo") ? new Date(searchParams.get("dueTo")!) : undefined,
    postedOnly: searchParams.get("posted") === "true",
    unpostedOnly: searchParams.get("unposted") === "true",
    overdueOnly: searchParams.get("overdue") === "true",
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  // PDF Generation
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const invoiceListPdf = useGenericPdfReport();

  // Invoice status and type options
  const invoiceStatusOptions = ["Draft", "Pending", "Sent", "Partial", "Paid", "Overdue", "Cancelled"];
  const invoiceTypeOptions = ["Regular", "Advance", "Security Deposit", "Penalty", "Adjustment"];

  // Initialize data on component mount
  useEffect(() => {
    initializeData();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchTerm) params.set("search", filters.searchTerm);
    if (filters.selectedCustomerId) params.set("customerId", filters.selectedCustomerId);
    if (filters.selectedContractId) params.set("contractId", filters.selectedContractId);
    if (filters.selectedInvoiceStatus) params.set("status", filters.selectedInvoiceStatus);
    if (filters.selectedInvoiceType) params.set("type", filters.selectedInvoiceType);
    if (filters.selectedPropertyId) params.set("propertyId", filters.selectedPropertyId);
    if (filters.dateFrom) params.set("from", filters.dateFrom.toISOString().split("T")[0]);
    if (filters.dateTo) params.set("to", filters.dateTo.toISOString().split("T")[0]);
    if (filters.dueDateFrom) params.set("dueFrom", filters.dueDateFrom.toISOString().split("T")[0]);
    if (filters.dueDateTo) params.set("dueTo", filters.dueDateTo.toISOString().split("T")[0]);
    if (filters.postedOnly) params.set("posted", "true");
    if (filters.unpostedOnly) params.set("unposted", "true");
    if (filters.overdueOnly) params.set("overdue", "true");

    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Apply filters and sorting whenever invoices or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [invoices, filters, sortConfig, activeTab]);

  // Initialize component data
  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchInvoices(), fetchReferenceData()]);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all invoices with payment information
  const fetchInvoices = async () => {
    try {
      const invoicesData = await invoiceService.getAllInvoices();

      // Enhance invoices with payment information
      const enhancedInvoices = await Promise.all(
        invoicesData.map(async (invoice) => {
          try {
            const receipts = await receiptService.getReceiptsByInvoice(invoice.LeaseInvoiceID);
            const validReceipts = receipts.filter(
              (r) => r.PaymentStatus !== PaymentStatus.CANCELLED && r.PaymentStatus !== PaymentStatus.BOUNCED && r.PaymentStatus !== PaymentStatus.REVERSED
            );
            const pendingReceipts = receipts.filter((r) => r.PaymentStatus === PaymentStatus.RECEIVED || r.PaymentStatus === PaymentStatus.DEPOSITED);

            const lastReceipt = validReceipts.length > 0 ? validReceipts.sort((a, b) => new Date(b.ReceiptDate).getTime() - new Date(a.ReceiptDate).getTime())[0] : null;

            const paymentProgress = invoice.TotalAmount > 0 ? (invoice.PaidAmount / invoice.TotalAmount) * 100 : 0;

            return {
              ...invoice,
              hasReceipts: validReceipts.length > 0,
              pendingReceipts: pendingReceipts.length,
              lastPaymentDate: lastReceipt?.ReceiptDate,
              paymentProgress,
            } as InvoiceWithPaymentInfo;
          } catch (error) {
            console.error(`Error fetching receipts for invoice ${invoice.LeaseInvoiceID}:`, error);
            return {
              ...invoice,
              hasReceipts: false,
              pendingReceipts: 0,
              paymentProgress: 0,
            } as InvoiceWithPaymentInfo;
          }
        })
      );

      setInvoices(enhancedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    }
  };

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [customersData, contractsData, propertiesData] = await Promise.all([
        customerService.getAllCustomers(),
        contractService.getAllContracts(),
        propertyService.getAllProperties().catch(() => []), // Properties optional
      ]);

      setCustomers(customersData);
      setContracts(contractsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchInvoices();
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
          invoice.CustomerFullName?.toLowerCase().includes(searchLower) ||
          invoice.ContractNo?.toLowerCase().includes(searchLower) ||
          invoice.PropertyName?.toLowerCase().includes(searchLower) ||
          invoice.UnitNo?.toLowerCase().includes(searchLower) ||
          invoice.Notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply customer filter
    if (filters.selectedCustomerId) {
      filtered = filtered.filter((invoice) => invoice.CustomerID.toString() === filters.selectedCustomerId);
    }

    // Apply contract filter
    if (filters.selectedContractId) {
      filtered = filtered.filter((invoice) => invoice.ContractID.toString() === filters.selectedContractId);
    }

    // Apply status filter
    if (filters.selectedInvoiceStatus) {
      filtered = filtered.filter((invoice) => invoice.InvoiceStatus === filters.selectedInvoiceStatus);
    }

    // Apply type filter
    if (filters.selectedInvoiceType) {
      filtered = filtered.filter((invoice) => invoice.InvoiceType === filters.selectedInvoiceType);
    }

    // Apply property filter
    // if (filters.selectedPropertyId) {
    //   filtered = filtered.filter((invoice) => invoice.PropertyID?.toString() === filters.selectedPropertyId);
    // }

    // Apply date filters
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

    // Apply posted/unposted filters
    // if (filters.postedOnly) {
    //   filtered = filtered.filter((invoice) => invoice.IsPosted);
    // }

    // if (filters.unpostedOnly) {
    //   filtered = filtered.filter((invoice) => !invoice.IsPosted);
    // }

    // Apply overdue filter
    if (filters.overdueOnly) {
      filtered = filtered.filter((invoice) => isOverdue(invoice));
    }

    // Apply tab-specific filtering
    if (activeTab !== "all") {
      filtered = filtered.filter((invoice) => {
        switch (activeTab) {
          case "pending":
            return ["Draft", "Pending", "Sent"].includes(invoice.InvoiceStatus);
          case "paid":
            return invoice.InvoiceStatus === "Paid";
          case "partial":
            return invoice.InvoiceStatus === "Partial";
          case "unpaid":
            return invoice.BalanceAmount > 0 && invoice.InvoiceStatus !== "Paid";
          case "overdue":
            return isOverdue(invoice) || invoice.InvoiceStatus === "Overdue";
          default:
            return true;
        }
      });
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
  }, [invoices, filters, sortConfig, activeTab]);

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
      selectedContractId: "",
      selectedInvoiceStatus: "",
      selectedInvoiceType: "",
      selectedPropertyId: "",
      dateFrom: undefined,
      dateTo: undefined,
      dueDateFrom: undefined,
      dueDateTo: undefined,
      postedOnly: false,
      unpostedOnly: false,
      overdueOnly: false,
    });
    setSearchParams(new URLSearchParams());
  };

  // Handle sorting
  const handleSort = (key: keyof LeaseInvoice) => {
    setSortConfig((prevSort) => ({
      key,
      direction: prevSort.key === key && prevSort.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Navigation handlers
  const handleAddInvoice = () => {
    navigate("/invoices/new");
  };

  const handleEditInvoice = (invoice: InvoiceWithPaymentInfo) => {
    navigate(`/invoices/edit/${invoice.LeaseInvoiceID}`);
  };

  const handleViewInvoice = (invoice: InvoiceWithPaymentInfo) => {
    navigate(`/invoices/${invoice.LeaseInvoiceID}`);
  };

  const handleViewReceipts = (invoice: InvoiceWithPaymentInfo) => {
    navigate(`/receipts?invoiceId=${invoice.LeaseInvoiceID}`);
  };

  const handleCreateReceipt = (invoice: InvoiceWithPaymentInfo) => {
    navigate(`/receipts/new?invoiceId=${invoice.LeaseInvoiceID}`);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredInvoices.map((i) => i.LeaseInvoiceID)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: number, checked: boolean) => {
    const newSelection = new Set(selectedInvoices);
    if (checked) {
      newSelection.add(invoiceId);
    } else {
      newSelection.delete(invoiceId);
    }
    setSelectedInvoices(newSelection);
  };

  // Bulk operations
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedInvoices.size === 0) return;

    try {
      const promises = Array.from(selectedInvoices).map((invoiceId) => invoiceService.changeInvoiceStatus(invoiceId, newStatus));

      await Promise.all(promises);

      // Update local state
      setInvoices((prev) => prev.map((invoice) => (selectedInvoices.has(invoice.LeaseInvoiceID) ? { ...invoice, InvoiceStatus: newStatus } : invoice)));

      setSelectedInvoices(new Set());
      toast.success(`${selectedInvoices.size} invoices updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update invoice statuses");
    }
  };

  // Delete handlers
  const openDeleteDialog = (invoice: InvoiceWithPaymentInfo) => {
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
  const openStatusChangeDialog = (invoice: InvoiceWithPaymentInfo, status: string) => {
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

  // Filter empty parameters for PDF generation
  const filterEmptyParameters = (params: any) => {
    const filtered: any = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "" && value !== 0) {
        filtered[key] = value;
      }
    });

    return filtered;
  };

  // PDF Generation handlers
  const handleGenerateInvoiceList = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : null,
      FilterContractID: filters.selectedContractId ? parseInt(filters.selectedContractId) : null,
      FilterInvoiceStatus: filters.selectedInvoiceStatus || "",
      FilterInvoiceType: filters.selectedInvoiceType || "",
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
      FilterDueDateFrom: filters.dueDateFrom,
      FilterDueDateTo: filters.dueDateTo,
      FilterPostedOnly: filters.postedOnly || null,
      FilterUnpostedOnly: filters.unpostedOnly || null,
      FilterOverdueOnly: filters.overdueOnly || null,
      ReportTitle: "Invoice List Report",
    };

    // Filter out empty parameters
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

  const handlePreviewInvoiceList = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : null,
      FilterContractID: filters.selectedContractId ? parseInt(filters.selectedContractId) : null,
      FilterInvoiceStatus: filters.selectedInvoiceStatus || "",
      FilterInvoiceType: filters.selectedInvoiceType || "",
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
      FilterDueDateFrom: filters.dueDateFrom,
      FilterDueDateTo: filters.dueDateTo,
      FilterPostedOnly: filters.postedOnly || null,
      FilterUnpostedOnly: filters.unpostedOnly || null,
      FilterOverdueOnly: filters.overdueOnly || null,
      ReportTitle: "Invoice List Report",
    };

    // Filter out empty parameters
    const filteredParameters = filterEmptyParameters(parameters);

    setShowPdfPreview(true);

    const response = await invoiceListPdf.generateReport("invoice-list", filteredParameters, {
      orientation: "Landscape",
      download: false,
      showToast: false,
    });

    if (!response.success) {
      toast.error("Failed to generate invoice list preview");
    }
  };

  // Utility functions
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

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

  const isOverdue = (invoice: InvoiceWithPaymentInfo) => {
    if (invoice.InvoiceStatus === "Paid" || invoice.BalanceAmount <= 0) return false;
    const dueDate = new Date(invoice.DueDate);
    const today = new Date();
    return dueDate < today;
  };

  // Calculate statistics
  const stats: InvoiceListStats = useMemo(() => {
    const filtered = filteredInvoices;
    return {
      total: filtered.length,
      draft: filtered.filter((i) => i.InvoiceStatus === "Draft").length,
      pending: filtered.filter((i) => i.InvoiceStatus === "Pending").length,
      sent: filtered.filter((i) => i.InvoiceStatus === "Sent").length,
      partial: filtered.filter((i) => i.InvoiceStatus === "Partial").length,
      paid: filtered.filter((i) => i.InvoiceStatus === "Paid").length,
      overdue: filtered.filter((i) => isOverdue(i) || i.InvoiceStatus === "Overdue").length,
      cancelled: filtered.filter((i) => i.InvoiceStatus === "Cancelled").length,
      totalValue: filtered.reduce((sum, i) => sum + (i.TotalAmount || 0), 0),
      totalPaid: filtered.reduce((sum, i) => sum + (i.PaidAmount || 0), 0),
      totalBalance: filtered.reduce((sum, i) => sum + (i.BalanceAmount || 0), 0),
      averageValue: filtered.length > 0 ? filtered.reduce((sum, i) => sum + (i.TotalAmount || 0), 0) / filtered.length : 0,
      overdueAmount: filtered.filter((i) => isOverdue(i)).reduce((sum, i) => sum + (i.BalanceAmount || 0), 0),
    };
  }, [filteredInvoices]);

  // Get tab counts
  const getTabCounts = () => {
    return {
      all: invoices.length,
      pending: invoices.filter((i) => ["Draft", "Pending", "Sent"].includes(i.InvoiceStatus)).length,
      paid: invoices.filter((i) => i.InvoiceStatus === "Paid").length,
      partial: invoices.filter((i) => i.InvoiceStatus === "Partial").length,
      unpaid: invoices.filter((i) => i.BalanceAmount > 0 && i.InvoiceStatus !== "Paid").length,
      overdue: invoices.filter((i) => isOverdue(i) || i.InvoiceStatus === "Overdue").length,
    };
  };

  const tabCounts = getTabCounts();

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm ||
    filters.selectedCustomerId ||
    filters.selectedContractId ||
    filters.selectedInvoiceStatus ||
    filters.selectedInvoiceType ||
    filters.selectedPropertyId ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.dueDateFrom ||
    filters.dueDateTo ||
    filters.postedOnly ||
    filters.unpostedOnly ||
    filters.overdueOnly;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Invoice Management</h1>
          <p className="text-muted-foreground">Manage lease invoices and track payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={handleAddInvoice}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
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
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Partial</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.partial}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Paid</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Overdue</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Value</span>
            </div>
            <div className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Total Paid</span>
            </div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(stats.totalPaid)}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Outstanding</span>
            </div>
            <div className="text-lg font-bold text-red-600">{formatCurrency(stats.totalBalance)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                {hasActiveFilters ? `Showing ${filteredInvoices.length} of ${invoices.length} invoices` : `Showing all ${invoices.length} invoices`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* PDF Generation */}
              <div className="flex space-x-2">
                <PdfActionButtons
                  onDownload={handleGenerateInvoiceList}
                  onPreview={handlePreviewInvoiceList}
                  isLoading={invoiceListPdf.isLoading}
                  downloadLabel="Download Invoice List"
                  previewLabel="Preview Invoice List"
                  variant="outline"
                  size="default"
                />
              </div>

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
                    <DropdownMenuItem disabled className="font-medium text-muted-foreground">
                      Change Status
                    </DropdownMenuItem>
                    {invoiceStatusOptions.map((status) => (
                      <DropdownMenuItem key={status} onClick={() => handleBulkStatusChange(status)}>
                        Set as {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={cn(showFilters && "bg-accent")}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    !
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-6 w-[600px] mb-6">
              <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({tabCounts.pending})</TabsTrigger>
              <TabsTrigger value="partial">Partial ({tabCounts.partial})</TabsTrigger>
              <TabsTrigger value="unpaid">Unpaid ({tabCounts.unpaid})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({tabCounts.paid})</TabsTrigger>
              <TabsTrigger value="overdue">Overdue ({tabCounts.overdue})</TabsTrigger>
            </TabsList>

            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
              {/* Search Bar */}
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search invoices..." className="pl-9" defaultValue={filters.searchTerm} onChange={handleSearchChange} />
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg">
                  <Select value={filters.selectedCustomerId || "all"} onValueChange={(value) => handleFilterChange("selectedCustomerId", value === "all" ? "" : value)}>
                    <SelectTrigger>
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

                  <Select value={filters.selectedContractId || "all"} onValueChange={(value) => handleFilterChange("selectedContractId", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Contract" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contracts</SelectItem>
                      {contracts.map((contract) => (
                        <SelectItem key={contract.ContractID} value={contract.ContractID.toString()}>
                          {contract.ContractNo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.selectedInvoiceStatus || "all"} onValueChange={(value) => handleFilterChange("selectedInvoiceStatus", value === "all" ? "" : value)}>
                    <SelectTrigger>
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

                  <Select value={filters.selectedInvoiceType || "all"} onValueChange={(value) => handleFilterChange("selectedInvoiceType", value === "all" ? "" : value)}>
                    <SelectTrigger>
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

                  <DatePicker value={filters.dateFrom} onChange={(date) => handleFilterChange("dateFrom", date)} placeholder="From date" />

                  <DatePicker value={filters.dateTo} onChange={(date) => handleFilterChange("dateTo", date)} placeholder="To date" />

                  <div className="flex items-center gap-2 col-span-full">
                    <Button variant="outline" onClick={clearFilters} size="sm">
                      <X className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {filters.searchTerm && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("searchTerm", "")}>
                      Search: {filters.searchTerm} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.selectedCustomerId && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedCustomerId", "")}>
                      Customer: {customers.find((c) => c.CustomerID.toString() === filters.selectedCustomerId)?.CustomerFullName}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.selectedInvoiceStatus && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedInvoiceStatus", "")}>
                      Status: {filters.selectedInvoiceStatus} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.dateFrom && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("dateFrom", undefined)}>
                      From: {formatDate(filters.dateFrom)} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.dateTo && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("dateTo", undefined)}>
                      To: {formatDate(filters.dateTo)} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value={activeTab}>
              {/* Invoice Table */}
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-10">
                  {hasActiveFilters ? (
                    <div>
                      <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-4">No invoices found matching your criteria.</p>
                      <Button variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-4">No invoices found. Create your first invoice to get started.</p>
                      <Button onClick={handleAddInvoice}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Invoice
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all invoices"
                          />
                        </TableHead>
                        <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort("InvoiceNo")}>
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
                        <TableHead className="cursor-pointer" onClick={() => handleSort("CustomerFullName")}>
                          <div className="flex items-center gap-1">
                            Customer
                            {sortConfig.key === "CustomerFullName" ? (
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
                        <TableHead>Contract & Unit</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("InvoiceDate")}>
                          <div className="flex items-center gap-1">
                            Invoice Date
                            {sortConfig.key === "InvoiceDate" ? (
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
                        <TableHead className="cursor-pointer" onClick={() => handleSort("DueDate")}>
                          <div className="flex items-center gap-1">
                            Due Date
                            {sortConfig.key === "DueDate" ? (
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
                        <TableHead className="cursor-pointer" onClick={() => handleSort("TotalAmount")}>
                          <div className="flex items-center gap-1">
                            Amount & Payment
                            {sortConfig.key === "TotalAmount" ? (
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
                        <TableHead className="cursor-pointer" onClick={() => handleSort("InvoiceStatus")}>
                          <div className="flex items-center gap-1">
                            Status
                            {sortConfig.key === "InvoiceStatus" ? (
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
                        <TableHead>Type</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow
                          key={invoice.LeaseInvoiceID}
                          className={cn("hover:bg-muted/50 transition-colors", selectedInvoices.has(invoice.LeaseInvoiceID) && "bg-accent/50", isOverdue(invoice) && "bg-red-50")}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedInvoices.has(invoice.LeaseInvoiceID)}
                              onCheckedChange={(checked) => handleSelectInvoice(invoice.LeaseInvoiceID, checked as boolean)}
                              aria-label={`Select invoice ${invoice.InvoiceNo}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{invoice.InvoiceNo}</div>
                              {isOverdue(invoice) && (
                                <div className="text-xs text-red-600 flex items-center">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {invoice.OverdueDays || 0} days overdue
                                </div>
                              )}
                              {invoice.hasReceipts && (
                                <div className="text-xs text-green-600 flex items-center">
                                  <Receipt className="h-3 w-3 mr-1" />
                                  Has payments
                                </div>
                              )}
                              {invoice.pendingReceipts && invoice.pendingReceipts > 0 && (
                                <div className="text-xs text-orange-600 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {invoice.pendingReceipts} pending
                                </div>
                              )}
                            </div>
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
                          <TableCell>{formatDate(invoice.InvoiceDate)}</TableCell>
                          <TableCell>
                            <div className={isOverdue(invoice) ? "text-red-600 font-medium" : ""}>{formatDate(invoice.DueDate)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{formatCurrency(invoice.TotalAmount)}</span>
                                {invoice.InvoiceStatus === "Partial" && <span className="text-xs text-muted-foreground">{invoice.paymentProgress?.toFixed(0)}%</span>}
                              </div>
                              {invoice.InvoiceStatus === "Partial" && <Progress value={invoice.paymentProgress} className="h-1" />}
                              <div className="flex justify-between text-sm">
                                <span className="text-green-600">Paid: {formatCurrency(invoice.PaidAmount)}</span>
                                <span className={invoice.BalanceAmount > 0 ? "text-red-600" : "text-green-600"}>Due: {formatCurrency(invoice.BalanceAmount)}</span>
                              </div>
                              {invoice.lastPaymentDate && <div className="text-xs text-muted-foreground">Last payment: {formatDate(invoice.lastPaymentDate)}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(invoice.InvoiceStatus)} className="flex items-center gap-1">
                              {getStatusIcon(invoice.InvoiceStatus)}
                              {invoice.InvoiceStatus}
                            </Badge>
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
                                <DropdownMenuItem onClick={() => handleEditInvoice(invoice)} disabled={invoice.InvoiceStatus === "Paid"}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={() => handleCreateReceipt(invoice)} disabled={invoice.BalanceAmount <= 0}>
                                  <Receipt className="mr-2 h-4 w-4" />
                                  Record Payment
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => handleViewReceipts(invoice)} disabled={!invoice.hasReceipts}>
                                  <History className="mr-2 h-4 w-4" />
                                  Payment History
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

                                <DropdownMenuItem
                                  className="text-red-500"
                                  onClick={() => openDeleteDialog(invoice)}
                                  disabled={invoice.InvoiceStatus === "Paid" || invoice.PaidAmount > 0}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfBlob={invoiceListPdf.data}
        title="Invoice List Report"
        isLoading={invoiceListPdf.isLoading}
        error={invoiceListPdf.error}
        onDownload={() => invoiceListPdf.downloadCurrentPdf("Invoice_List_Report.pdf")}
        onRefresh={handlePreviewInvoiceList}
      />

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
