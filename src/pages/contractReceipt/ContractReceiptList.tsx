// src/pages/contractReceipt/ContractReceiptList.tsx - Updated with Comprehensive Approval System
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
  Receipt,
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
  Banknote,
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
import { leaseReceiptService } from "@/services/contractReceiptService";
import { customerService } from "@/services/customerService";
import { propertyService } from "@/services/propertyService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { accountService } from "@/services/accountService";
import { currencyService } from "@/services/currencyService";
import { bankService } from "@/services/bankService";
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
  ContractReceipt,
  ReceiptSearchParams,
  ReceiptStatistics,
  ReceiptPostingRequest,
  BulkReceiptPostingRequest,
  SelectedReceiptForPosting,
  BulkOperationRequest,
  BulkReceiptOperation,
  ReceiptApprovalRequest,
  ReceiptRejectionRequest,
  PAYMENT_TYPE,
  PAYMENT_STATUS,
  BULK_OPERATION_TYPE,
  APPROVAL_STATUS,
} from "@/types/contractReceiptTypes";
import { PdfPreviewModal } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

// Posting schema
const postingSchema = z.object({
  postingDate: z.date({ required_error: "Posting date is required" }),
  debitAccountId: z.string().min(1, "Debit account is required"),
  creditAccountId: z.string().min(1, "Credit account is required"),
  narration: z.string().optional(),
  exchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").optional(),
});

// Bulk deposit schema
const bulkDepositSchema = z.object({
  depositDate: z.date({ required_error: "Deposit date is required" }),
  depositBankId: z.string().min(1, "Deposit bank is required"),
});

type PostingFormValues = z.infer<typeof postingSchema>;
type BulkDepositFormValues = z.infer<typeof bulkDepositSchema>;

// Types and interfaces
interface ReceiptFilter {
  searchTerm: string;
  selectedCustomerId: string;
  selectedPropertyId: string;
  selectedPaymentStatus: string;
  selectedApprovalStatus: string;
  selectedPaymentType: string;
  selectedBankId: string;
  dateFrom?: Date;
  dateTo?: Date;
  depositDateFrom?: Date;
  depositDateTo?: Date;
  showPostedOnly?: boolean;
  showAdvanceOnly?: boolean;
}

interface SortConfig {
  key: keyof ContractReceipt | null;
  direction: "asc" | "desc";
}

interface ReceiptListStats {
  total: number;
  unposted: number;
  posted: number;
  pendingDeposits: number;
  advance: number;
  bounced: number;
  totalAmount: number;
  selectedCount: number;
  selectedAmount: number;
  approvalPending: number;
  approvalApproved: number;
  approvalRejected: number;
  approvedProtected: number;
}

const ContractReceiptList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [receipts, setReceipts] = useState<ContractReceipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<ContractReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState<Set<number>>(new Set());

  // Reference data
  const [customers, setCustomers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
  const [bulkPostingDialogOpen, setBulkPostingDialogOpen] = useState(false);
  const [bulkDepositDialogOpen, setBulkDepositDialogOpen] = useState(false);

  // Approval dialog states
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [bulkApprovalDialogOpen, setBulkApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkApprovalLoading, setBulkApprovalLoading] = useState(false);

  // Selected items for actions
  const [selectedReceipt, setSelectedReceipt] = useState<ContractReceipt | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  // Filter and sort state
  const [filters, setFilters] = useState<ReceiptFilter>({
    searchTerm: searchParams.get("search") || "",
    selectedCustomerId: searchParams.get("customer") || "",
    selectedPropertyId: searchParams.get("property") || "",
    selectedPaymentStatus: searchParams.get("status") || "",
    selectedApprovalStatus: searchParams.get("approval") || "",
    selectedPaymentType: searchParams.get("type") || "",
    selectedBankId: searchParams.get("bank") || "",
    dateFrom: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    dateTo: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
    depositDateFrom: searchParams.get("depositFrom") ? new Date(searchParams.get("depositFrom")!) : undefined,
    depositDateTo: searchParams.get("depositTo") ? new Date(searchParams.get("depositTo")!) : undefined,
    showPostedOnly: searchParams.get("posted") === "true",
    showAdvanceOnly: searchParams.get("advance") === "true",
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  // Statistics
  const [statistics, setStatistics] = useState<ReceiptStatistics>({
    statusCounts: [],
    approvalCounts: [],
    paymentTypeCounts: [],
    monthlyTrends: [],
    pendingDeposits: { PendingDepositCount: 0, PendingDepositAmount: 0, AvgDaysWaiting: 0 },
  });

  // Active tab
  const [activeTab, setActiveTab] = useState("all");

  // PDF functionality
  const [showReceiptListPdfPreview, setShowReceiptListPdfPreview] = useState(false);
  const receiptListPdf = useGenericPdfReport();

  // Form instances
  const postingForm = useForm<PostingFormValues>({
    resolver: zodResolver(postingSchema),
    defaultValues: {
      postingDate: new Date(),
      exchangeRate: 1,
    },
  });

  const bulkDepositForm = useForm<BulkDepositFormValues>({
    resolver: zodResolver(bulkDepositSchema),
    defaultValues: {
      depositDate: new Date(),
    },
  });

  // Payment status and type options
  const paymentStatusOptions = Object.values(PAYMENT_STATUS);
  const paymentTypeOptions = Object.values(PAYMENT_TYPE);
  const approvalStatusOptions = Object.values(APPROVAL_STATUS);

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
    if (filters.selectedPaymentStatus) params.set("status", filters.selectedPaymentStatus);
    if (filters.selectedApprovalStatus) params.set("approval", filters.selectedApprovalStatus);
    if (filters.selectedPaymentType) params.set("type", filters.selectedPaymentType);
    if (filters.selectedBankId) params.set("bank", filters.selectedBankId);
    if (filters.dateFrom) params.set("from", filters.dateFrom.toISOString().split("T")[0]);
    if (filters.dateTo) params.set("to", filters.dateTo.toISOString().split("T")[0]);
    if (filters.depositDateFrom) params.set("depositFrom", filters.depositDateFrom.toISOString().split("T")[0]);
    if (filters.depositDateTo) params.set("depositTo", filters.depositDateTo.toISOString().split("T")[0]);
    if (filters.showPostedOnly) params.set("posted", "true");
    if (filters.showAdvanceOnly) params.set("advance", "true");

    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Apply filters and sorting whenever receipts or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [receipts, filters, sortConfig]);

  // Initialize component data
  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchReceipts(), fetchReferenceData(), fetchStatistics()]);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data functions
  const fetchReceipts = async () => {
    try {
      const receiptsData = await leaseReceiptService.getAllReceipts();
      setReceipts(receiptsData);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Failed to load receipts");
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [customersData, propertiesData, companiesData, fiscalYearsData, accountsData, currenciesData, banksData] = await Promise.all([
        customerService.getAllCustomers(),
        propertyService.getAllProperties(),
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
        accountService.getAllAccounts(),
        currencyService.getAllCurrencies(),
        bankService.getAllBanks(),
      ]);

      setCustomers(customersData);
      setProperties(propertiesData);
      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
      setAccounts(accountsData.filter((acc) => acc.IsActive && acc.IsPostable));
      setCurrencies(currenciesData);
      setBanks(banksData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await leaseReceiptService.getReceiptStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchReceipts(), fetchStatistics()]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...receipts];

    // Apply text search
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (receipt) =>
          receipt.ReceiptNo?.toLowerCase().includes(searchLower) ||
          receipt.CustomerName?.toLowerCase().includes(searchLower) ||
          receipt.InvoiceNo?.toLowerCase().includes(searchLower) ||
          receipt.PropertyName?.toLowerCase().includes(searchLower) ||
          receipt.ChequeNo?.toLowerCase().includes(searchLower) ||
          receipt.TransactionReference?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filters.selectedCustomerId) {
      filtered = filtered.filter((receipt) => receipt.CustomerID?.toString() === filters.selectedCustomerId);
    }

    if (filters.selectedPropertyId) {
      filtered = filtered.filter((receipt) => receipt.PropertyName === properties.find((p) => p.PropertyID.toString() === filters.selectedPropertyId)?.PropertyName);
    }

    if (filters.selectedPaymentStatus) {
      filtered = filtered.filter((receipt) => receipt.PaymentStatus === filters.selectedPaymentStatus);
    }

    if (filters.selectedApprovalStatus) {
      filtered = filtered.filter((receipt) => receipt.ApprovalStatus === filters.selectedApprovalStatus);
    }

    if (filters.selectedPaymentType) {
      filtered = filtered.filter((receipt) => receipt.PaymentType === filters.selectedPaymentType);
    }

    if (filters.selectedBankId) {
      filtered = filtered.filter((receipt) => receipt.BankID?.toString() === filters.selectedBankId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((receipt) => new Date(receipt.ReceiptDate) >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((receipt) => new Date(receipt.ReceiptDate) <= filters.dateTo!);
    }

    if (filters.depositDateFrom && filters.depositDateTo) {
      filtered = filtered.filter((receipt) => {
        if (!receipt.DepositDate) return false;
        const depositDate = new Date(receipt.DepositDate);
        return depositDate >= filters.depositDateFrom! && depositDate <= filters.depositDateTo!;
      });
    }

    if (filters.showPostedOnly) {
      filtered = filtered.filter((receipt) => receipt.IsPosted);
    }

    if (filters.showAdvanceOnly) {
      filtered = filtered.filter((receipt) => receipt.IsAdvancePayment);
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

    setFilteredReceipts(filtered);
  }, [receipts, filters, sortConfig, properties]);

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
  const handleFilterChange = (key: keyof ReceiptFilter, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      selectedCustomerId: "",
      selectedPropertyId: "",
      selectedPaymentStatus: "",
      selectedApprovalStatus: "",
      selectedPaymentType: "",
      selectedBankId: "",
      dateFrom: undefined,
      dateTo: undefined,
      depositDateFrom: undefined,
      depositDateTo: undefined,
      showPostedOnly: undefined,
      showAdvanceOnly: undefined,
    });
    setSearchParams(new URLSearchParams());
    setSelectedReceipts(new Set());
  };

  // Handle sorting
  const handleSort = (key: keyof ContractReceipt) => {
    setSortConfig((prevSort) => ({
      key,
      direction: prevSort.key === key && prevSort.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Check if receipt can be edited
  const canEditReceipt = (receipt: ContractReceipt) => {
    return receipt.ApprovalStatus !== APPROVAL_STATUS.APPROVED;
  };

  // Get filtered receipts based on active tab
  const getFilteredReceipts = () => {
    switch (activeTab) {
      case "unposted":
        return filteredReceipts.filter((receipt) => !receipt.IsPosted);
      case "posted":
        return filteredReceipts.filter((receipt) => receipt.IsPosted);
      case "pending-deposits":
        return filteredReceipts.filter((receipt) => receipt.RequiresDeposit && !receipt.DepositDate);
      case "advance":
        return filteredReceipts.filter((receipt) => receipt.IsAdvancePayment);
      case "bounced":
        return filteredReceipts.filter((receipt) => receipt.PaymentStatus === PAYMENT_STATUS.BOUNCED);
      case "pending-approval":
        return filteredReceipts.filter((receipt) => receipt.ApprovalStatus === APPROVAL_STATUS.PENDING);
      case "approved":
        return filteredReceipts.filter((receipt) => receipt.ApprovalStatus === APPROVAL_STATUS.APPROVED);
      default:
        return filteredReceipts;
    }
  };

  // Navigation handlers
  const handleCreateReceipt = () => {
    navigate("/receipts/new");
  };

  const handleViewReceipt = (receipt: ContractReceipt) => {
    navigate(`/receipts/${receipt.LeaseReceiptID}`);
  };

  const handleEditReceipt = (receipt: ContractReceipt) => {
    if (!canEditReceipt(receipt)) {
      toast.error("Cannot edit approved receipts. Please reset approval status first if changes are needed.");
      return;
    }
    navigate(`/receipts/edit/${receipt.LeaseReceiptID}`);
  };

  // Analytics navigation
  const handleViewPendingApprovals = () => {
    setFilters((prev) => ({ ...prev, selectedApprovalStatus: APPROVAL_STATUS.PENDING }));
    setActiveTab("pending-approval");
    setShowFilters(true);
  };

  // Selection handlers
  const handleSelectReceipt = (receiptId: number, checked: boolean) => {
    const newSelection = new Set(selectedReceipts);
    if (checked) {
      newSelection.add(receiptId);
    } else {
      newSelection.delete(receiptId);
    }
    setSelectedReceipts(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentReceipts = getFilteredReceipts();
      setSelectedReceipts(new Set(currentReceipts.map((receipt) => receipt.LeaseReceiptID)));
    } else {
      setSelectedReceipts(new Set());
    }
  };

  // Approval handlers for individual receipts
  const handleApproveReceipt = async (receipt: ContractReceipt) => {
    if (!isManager) return;

    try {
      setActionLoading(true);
      const response = await leaseReceiptService.approveReceipt({ LeaseReceiptID: receipt.LeaseReceiptID });

      if (response.Status === 1) {
        setReceipts(receipts.map((r) => (r.LeaseReceiptID === receipt.LeaseReceiptID ? { ...r, ApprovalStatus: APPROVAL_STATUS.APPROVED } : r)));
        toast.success("Receipt approved successfully");
      } else {
        toast.error(response.Message || "Failed to approve receipt");
      }
    } catch (error) {
      console.error("Error approving receipt:", error);
      toast.error("Failed to approve receipt");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReceipt = async (receipt: ContractReceipt) => {
    if (!isManager) return;

    try {
      setActionLoading(true);
      const response = await leaseReceiptService.rejectReceipt({
        LeaseReceiptID: receipt.LeaseReceiptID,
        RejectionReason: "Quick rejection from list",
      });

      if (response.Status === 1) {
        setReceipts(receipts.map((r) => (r.LeaseReceiptID === receipt.LeaseReceiptID ? { ...r, ApprovalStatus: APPROVAL_STATUS.REJECTED } : r)));
        toast.success("Receipt rejected successfully");
      } else {
        toast.error(response.Message || "Failed to reject receipt");
      }
    } catch (error) {
      console.error("Error rejecting receipt:", error);
      toast.error("Failed to reject receipt");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetApprovalStatus = async (receipt: ContractReceipt) => {
    if (!isManager) return;

    try {
      setActionLoading(true);
      const response = await leaseReceiptService.resetReceiptApprovalStatus(receipt.LeaseReceiptID);

      if (response.Status === 1) {
        setReceipts(receipts.map((r) => (r.LeaseReceiptID === receipt.LeaseReceiptID ? { ...r, ApprovalStatus: APPROVAL_STATUS.PENDING } : r)));
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
    if (!isManager || selectedReceipts.size === 0) return;

    const pendingReceipts = Array.from(selectedReceipts).filter((receiptId) => {
      const receipt = receipts.find((r) => r.LeaseReceiptID === receiptId);
      return receipt?.ApprovalStatus === APPROVAL_STATUS.PENDING;
    });

    if (pendingReceipts.length === 0) {
      toast.error("No pending receipts selected for approval action");
      return;
    }

    setBulkApprovalLoading(true);

    try {
      if (action === "approve") {
        const response = await leaseReceiptService.performBulkApprovalOperation({
          SelectedReceiptIDs: pendingReceipts,
          BulkOperation: "Approve",
          BulkApprovalComments: approvalComments,
        });

        if (response.Status === 1) {
          setReceipts(receipts.map((r) => (pendingReceipts.includes(r.LeaseReceiptID) ? { ...r, ApprovalStatus: APPROVAL_STATUS.APPROVED } : r)));
          toast.success(`${pendingReceipts.length} receipts approved successfully`);
        } else {
          toast.error(response.Message || "Failed to approve receipts");
        }
      } else {
        const response = await leaseReceiptService.performBulkApprovalOperation({
          SelectedReceiptIDs: pendingReceipts,
          BulkOperation: "Reject",
          BulkRejectionReason: rejectionReason,
        });

        if (response.Status === 1) {
          setReceipts(receipts.map((r) => (pendingReceipts.includes(r.LeaseReceiptID) ? { ...r, ApprovalStatus: APPROVAL_STATUS.REJECTED } : r)));
          toast.success(`${pendingReceipts.length} receipts rejected successfully`);
        } else {
          toast.error(response.Message || "Failed to reject receipts");
        }
      }

      setSelectedReceipts(new Set());
    } catch (error) {
      toast.error(`Failed to ${action} receipts`);
    } finally {
      setBulkApprovalLoading(false);
      setBulkApprovalDialogOpen(false);
      setApprovalComments("");
      setRejectionReason("");
    }
  };

  // Status change handlers
  const openStatusChangeDialog = (receipt: ContractReceipt, status: string) => {
    if (!canEditReceipt(receipt)) {
      toast.error("Cannot change status of approved receipts. Please reset approval status first if changes are needed.");
      return;
    }
    setSelectedReceipt(receipt);
    setNewStatus(status);
    setStatusChangeDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!selectedReceipt || !newStatus) return;

    try {
      setActionLoading(true);
      const clearanceDate = newStatus === PAYMENT_STATUS.CLEARED ? new Date() : undefined;
      const response = await leaseReceiptService.changeReceiptStatus(selectedReceipt.LeaseReceiptID, newStatus, clearanceDate);

      if (response.Status === 1) {
        setReceipts(receipts.map((r) => (r.LeaseReceiptID === selectedReceipt.LeaseReceiptID ? { ...r, PaymentStatus: newStatus, ClearanceDate: clearanceDate } : r)));
        toast.success(`Receipt status changed to ${newStatus}`);
        setStatusChangeDialogOpen(false);
        setSelectedReceipt(null);
        setNewStatus("");
      } else {
        toast.error(response.Message || "Failed to change receipt status");
      }
    } catch (error) {
      console.error("Error changing receipt status:", error);
      toast.error("Failed to change receipt status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (receipt: ContractReceipt) => {
    if (!canEditReceipt(receipt)) {
      toast.error("Cannot delete approved receipts. Please reset approval status first if deletion is needed.");
      return;
    }
    setSelectedReceipt(receipt);
    setDeleteDialogOpen(true);
  };

  const handleDeleteReceipt = async () => {
    if (!selectedReceipt) return;

    try {
      setActionLoading(true);
      const response = await leaseReceiptService.deleteReceipt(selectedReceipt.LeaseReceiptID);

      if (response.Status === 1) {
        setReceipts(receipts.filter((r) => r.LeaseReceiptID !== selectedReceipt.LeaseReceiptID));
        toast.success("Receipt deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedReceipt(null);
      } else {
        toast.error(response.Message || "Failed to delete receipt");
      }
    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast.error("Failed to delete receipt");
    } finally {
      setActionLoading(false);
    }
  };

  // Posting handlers
  const openPostingDialog = (receipt: ContractReceipt) => {
    setSelectedReceipt(receipt);
    setPostingDialogOpen(true);
  };

  const handlePostReceipt = async (data: PostingFormValues) => {
    if (!selectedReceipt) return;

    try {
      setActionLoading(true);
      const postingRequest: ReceiptPostingRequest = {
        LeaseReceiptID: selectedReceipt.LeaseReceiptID,
        PostingDate: data.postingDate,
        DebitAccountID: parseInt(data.debitAccountId),
        CreditAccountID: parseInt(data.creditAccountId),
        PostingNarration: data.narration,
        ExchangeRate: data.exchangeRate,
      };

      const response = await leaseReceiptService.postSingleReceipt(postingRequest);

      if (response.Status === 1) {
        setReceipts(receipts.map((r) => (r.LeaseReceiptID === selectedReceipt.LeaseReceiptID ? { ...r, IsPosted: true } : r)));
        toast.success("Receipt posted successfully");
        setPostingDialogOpen(false);
        setSelectedReceipt(null);
        postingForm.reset();
      } else {
        toast.error(response.Message || "Failed to post receipt");
      }
    } catch (error) {
      console.error("Error posting receipt:", error);
      toast.error("Failed to post receipt");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk posting handlers
  const handleBulkPost = async (data: PostingFormValues) => {
    if (selectedReceipts.size === 0) return;

    // Filter out approved and unposted receipts
    const eligibleReceipts = Array.from(selectedReceipts)
      .map((id) => receipts.find((r) => r.LeaseReceiptID === id))
      .filter((receipt) => receipt && receipt.ApprovalStatus === APPROVAL_STATUS.APPROVED && !receipt.IsPosted) as ContractReceipt[];

    if (eligibleReceipts.length === 0) {
      toast.error("No eligible receipts selected for posting. Only approved and unposted receipts can be posted.");
      return;
    }

    try {
      setActionLoading(true);

      let postedCount = 0;
      let failedCount = 0;

      for (const receipt of eligibleReceipts) {
        try {
          const postingRequest: ReceiptPostingRequest = {
            LeaseReceiptID: receipt.LeaseReceiptID,
            PostingDate: data.postingDate,
            DebitAccountID: parseInt(data.debitAccountId),
            CreditAccountID: parseInt(data.creditAccountId),
            PostingNarration: data.narration || `Receipt - ${receipt.ReceiptNo}`,
            ExchangeRate: data.exchangeRate,
          };

          const response = await leaseReceiptService.postSingleReceipt(postingRequest);
          if (response.Status === 1) {
            postedCount++;
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      setReceipts(receipts.map((r) => (selectedReceipts.has(r.LeaseReceiptID) && eligibleReceipts.includes(r) ? { ...r, IsPosted: true } : r)));

      toast.success(`Posted ${postedCount} receipts successfully`);
      if (failedCount > 0) {
        toast.warning(`${failedCount} receipts failed to post`);
      }

      setBulkPostingDialogOpen(false);
      setSelectedReceipts(new Set());
      postingForm.reset();
    } catch (error) {
      console.error("Error posting receipts:", error);
      toast.error("Failed to post receipts");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk deposit handlers
  const handleBulkDeposit = async (data: BulkDepositFormValues) => {
    if (selectedReceipts.size === 0) return;

    try {
      setActionLoading(true);
      const selectedReceiptOperations: BulkReceiptOperation[] = Array.from(selectedReceipts).map((id) => ({
        LeaseReceiptID: id,
        Operation: "Deposit",
        DepositBankID: parseInt(data.depositBankId),
        DepositDate: data.depositDate,
      }));

      const bulkOperationRequest: BulkOperationRequest = {
        BulkOperation: BULK_OPERATION_TYPE.DEPOSIT,
        SelectedReceipts: selectedReceiptOperations,
        BulkDepositDate: data.depositDate,
        BulkDepositBankID: parseInt(data.depositBankId),
      };

      const response = await leaseReceiptService.performBulkOperation(bulkOperationRequest);

      if (response.Status === 1) {
        setReceipts(receipts.map((r) => (selectedReceipts.has(r.LeaseReceiptID) ? { ...r, DepositDate: data.depositDate, DepositedBankID: parseInt(data.depositBankId) } : r)));
        toast.success(`Updated ${response.UpdatedCount} receipts successfully`);
        if (response.FailedCount > 0) {
          toast.warning(`${response.FailedCount} receipts failed to update`);
        }
        setBulkDepositDialogOpen(false);
        setSelectedReceipts(new Set());
        bulkDepositForm.reset();
      } else {
        toast.error(response.Message || "Failed to perform bulk deposit");
      }
    } catch (error) {
      console.error("Error performing bulk deposit:", error);
      toast.error("Failed to perform bulk deposit");
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

  const handleGenerateReceiptListReport = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : null,
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterPaymentStatus: filters.selectedPaymentStatus || "",
      FilterApprovalStatus: filters.selectedApprovalStatus || "",
      FilterPaymentType: filters.selectedPaymentType || "",
      FilterBankID: filters.selectedBankId ? parseInt(filters.selectedBankId) : null,
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
      FilterDepositFromDate: filters.depositDateFrom,
      FilterDepositToDate: filters.depositDateTo,
      FilterPostedOnly: filters.showPostedOnly,
      FilterAdvanceOnly: filters.showAdvanceOnly,
    };

    const filteredParameters = filterEmptyParameters(parameters);

    const response = await receiptListPdf.generateReport("receipt-list", filteredParameters, {
      orientation: "Landscape",
      download: true,
      showToast: true,
      filename: `Receipt_List_${new Date().toISOString().split("T")[0]}.pdf`,
    });

    if (response.success) {
      toast.success("Receipt list report generated successfully");
    }
  };

  const handlePreviewReceiptListReport = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : null,
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterPaymentStatus: filters.selectedPaymentStatus || "",
      FilterApprovalStatus: filters.selectedApprovalStatus || "",
      FilterPaymentType: filters.selectedPaymentType || "",
      FilterBankID: filters.selectedBankId ? parseInt(filters.selectedBankId) : null,
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
      FilterDepositFromDate: filters.depositDateFrom,
      FilterDepositToDate: filters.depositDateTo,
      FilterPostedOnly: filters.showPostedOnly,
      FilterAdvanceOnly: filters.showAdvanceOnly,
    };

    const filteredParameters = filterEmptyParameters(parameters);

    setShowReceiptListPdfPreview(true);

    const response = await receiptListPdf.generateReport("receipt-list", filteredParameters, {
      orientation: "Landscape",
      download: false,
      showToast: false,
    });

    if (!response.success) {
      toast.error("Failed to generate receipt list preview");
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      [PAYMENT_STATUS.RECEIVED]: { variant: "default" as const, icon: Clock, className: "bg-blue-100 text-blue-800" },
      [PAYMENT_STATUS.DEPOSITED]: { variant: "default" as const, icon: Banknote, className: "bg-purple-100 text-purple-800" },
      [PAYMENT_STATUS.CLEARED]: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      [PAYMENT_STATUS.BOUNCED]: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
      [PAYMENT_STATUS.CANCELLED]: { variant: "secondary" as const, icon: XCircle, className: "bg-gray-100 text-gray-800" },
      [PAYMENT_STATUS.PENDING]: { variant: "secondary" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[PAYMENT_STATUS.RECEIVED];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Render approval status badge
  const renderApprovalBadge = (status: string) => {
    const approvalConfig = {
      [APPROVAL_STATUS.PENDING]: { icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      [APPROVAL_STATUS.APPROVED]: { icon: CheckCircle, className: "bg-green-100 text-green-800" },
      [APPROVAL_STATUS.REJECTED]: { icon: XCircle, className: "bg-red-100 text-red-800" },
      [APPROVAL_STATUS.NOT_REQUIRED]: { icon: CheckCircle, className: "bg-gray-100 text-gray-800" },
    };

    const config = approvalConfig[status as keyof typeof approvalConfig] || approvalConfig[APPROVAL_STATUS.PENDING];
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
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate statistics
  const currentReceipts = getFilteredReceipts();
  const stats: ReceiptListStats = useMemo(() => {
    return {
      total: receipts.length,
      unposted: receipts.filter((r) => !r.IsPosted).length,
      posted: receipts.filter((r) => r.IsPosted).length,
      pendingDeposits: receipts.filter((r) => r.RequiresDeposit && !r.DepositDate).length,
      advance: receipts.filter((r) => r.IsAdvancePayment).length,
      bounced: receipts.filter((r) => r.PaymentStatus === PAYMENT_STATUS.BOUNCED).length,
      totalAmount: receipts.reduce((sum, r) => sum + r.ReceivedAmount, 0),
      selectedCount: selectedReceipts.size,
      selectedAmount: Array.from(selectedReceipts).reduce((sum, id) => {
        const receipt = receipts.find((r) => r.LeaseReceiptID === id);
        return sum + (receipt?.ReceivedAmount || 0);
      }, 0),
      approvalPending: receipts.filter((r) => r.ApprovalStatus === APPROVAL_STATUS.PENDING).length,
      approvalApproved: receipts.filter((r) => r.ApprovalStatus === APPROVAL_STATUS.APPROVED).length,
      approvalRejected: receipts.filter((r) => r.ApprovalStatus === APPROVAL_STATUS.REJECTED).length,
      approvedProtected: receipts.filter((r) => r.ApprovalStatus === APPROVAL_STATUS.APPROVED).length,
    };
  }, [receipts, selectedReceipts]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm ||
    filters.selectedCustomerId ||
    filters.selectedPropertyId ||
    filters.selectedPaymentStatus ||
    filters.selectedApprovalStatus ||
    filters.selectedPaymentType ||
    filters.selectedBankId ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.depositDateFrom ||
    filters.depositDateTo ||
    filters.showPostedOnly ||
    filters.showAdvanceOnly;

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
            <h1 className="text-2xl font-semibold">Contract Receipt Management</h1>
            <p className="text-muted-foreground">Manage lease receipts, approvals, and payment posting</p>
          </div>
          <div className="flex items-center gap-2">
            {isManager && stats.approvalPending > 0 && (
              <Button variant="outline" onClick={handleViewPendingApprovals} className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <Shield className="mr-2 h-4 w-4" />
                {stats.approvalPending} Pending Approval{stats.approvalPending !== 1 ? "s" : ""}
              </Button>
            )}
            {stats.approvedProtected > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="bg-green-50 border-green-200 text-green-800">
                    <Lock className="mr-2 h-4 w-4" />
                    {stats.approvedProtected} Protected
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.approvedProtected} approved receipts are protected from modifications</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button onClick={handleCreateReceipt}>
              <Plus className="mr-2 h-4 w-4" />
              New Receipt
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Contract Receipts</CardTitle>
            <CardDescription>
              {hasActiveFilters ? `Showing ${currentReceipts.length} of ${receipts.length} receipts` : `Showing all ${receipts.length} receipts`}
              {stats.approvedProtected > 0 && <span className="ml-2 text-green-600">• {stats.approvedProtected} approved receipts are protected from modifications</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">{hasActiveFilters ? `of ${receipts.length} total` : "receipts"}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-muted-foreground">Unposted</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{stats.unposted}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Posted</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{stats.posted}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-muted-foreground">Pending Deposits</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{stats.pendingDeposits}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-muted-foreground">Advance</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{stats.advance}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                  </div>
                  <div className="text-lg font-bold text-indigo-600">{formatCurrency(stats.totalAmount)}</div>
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
                      <div className="text-2xl font-bold text-yellow-600">{stats.approvalPending}</div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">Approved</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{stats.approvalApproved}</div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">Protected</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{stats.approvedProtected}</div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-muted-foreground">Rejected</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">{stats.approvalRejected}</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search receipts..." className="pl-9" defaultValue={filters.searchTerm} onChange={handleSearchChange} />
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

                <Select value={filters.selectedPaymentStatus || "all"} onValueChange={(value) => handleFilterChange("selectedPaymentStatus", value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[140px] flex-shrink-0">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {paymentStatusOptions.map((status) => (
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

                <Select value={filters.selectedPaymentType || "all"} onValueChange={(value) => handleFilterChange("selectedPaymentType", value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[140px] flex-shrink-0">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {paymentTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.selectedBankId || "all"} onValueChange={(value) => handleFilterChange("selectedBankId", value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[140px] flex-shrink-0">
                    <SelectValue placeholder="Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Banks</SelectItem>
                    {banks.map((bank) => (
                      <SelectItem key={bank.BankID} value={bank.BankID.toString()}>
                        {bank.BankName}
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
                  <TabsTrigger value="pending-deposits">Pending Deposits ({stats.pendingDeposits})</TabsTrigger>
                  <TabsTrigger value="advance">Advance ({stats.advance})</TabsTrigger>
                  {isManager && <TabsTrigger value="pending-approval">Pending ({stats.approvalPending})</TabsTrigger>}
                  {isManager && <TabsTrigger value="approved">Approved ({stats.approvalApproved})</TabsTrigger>}
                </TabsList>

                <div className="flex items-center gap-2">
                  {/* PDF Generation */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" disabled={receiptListPdf.isLoading}>
                        {receiptListPdf.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handlePreviewReceiptListReport}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleGenerateReceiptListReport}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Bulk Operations */}
                  {selectedReceipts.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          Bulk Actions ({selectedReceipts.size})
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setBulkPostingDialogOpen(true)}>
                          <Send className="mr-2 h-4 w-4" />
                          Post Selected
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setBulkDepositDialogOpen(true)}>
                          <Banknote className="mr-2 h-4 w-4" />
                          Mark Deposited
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
                {selectedReceipts.size > 0 && (
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">
                          {selectedReceipts.size} receipt{selectedReceipts.size !== 1 ? "s" : ""} selected
                        </div>
                        <div className="text-sm text-muted-foreground">Total: {formatCurrency(stats.selectedAmount)}</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedReceipts(new Set())}>
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                )}

                {/* Receipt Table */}
                {currentReceipts.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">{hasActiveFilters ? "No receipts found matching your criteria." : "No receipts found."}</div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox checked={selectedReceipts.size === currentReceipts.length && currentReceipts.length > 0} onCheckedChange={handleSelectAll} />
                          </TableHead>
                          <TableHead className="w-[160px] cursor-pointer" onClick={() => handleSort("ReceiptNo")}>
                            <div className="flex items-center gap-1">
                              Receipt #
                              {sortConfig.key === "ReceiptNo" ? (
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
                          <TableHead>Payment Details</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Approval</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentReceipts.map((receipt) => {
                          const isApproved = receipt.ApprovalStatus === APPROVAL_STATUS.APPROVED;
                          const canEdit = canEditReceipt(receipt);

                          return (
                            <TableRow
                              key={receipt.LeaseReceiptID}
                              className={cn("hover:bg-muted/50 transition-colors", selectedReceipts.has(receipt.LeaseReceiptID) && "bg-accent/50", isApproved && "bg-green-50/30")}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedReceipts.has(receipt.LeaseReceiptID)}
                                  onCheckedChange={(checked) => handleSelectReceipt(receipt.LeaseReceiptID, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">{receipt.ReceiptNo}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(receipt.ReceiptDate)}
                                    </div>
                                    {receipt.RequiresDeposit && !receipt.DepositDate && (
                                      <Badge variant="secondary" className="text-xs mt-1">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Needs Deposit
                                      </Badge>
                                    )}
                                  </div>
                                  {isApproved && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Lock className="h-3 w-3 text-green-600" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Protected - Approved receipts cannot be modified</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{receipt.CustomerName}</div>
                                    <div className="text-sm text-muted-foreground">{receipt.CustomerNo}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {receipt.PaymentType === PAYMENT_TYPE.CHEQUE && receipt.ChequeNo && <div>Cheque: {receipt.ChequeNo}</div>}
                                  {receipt.PaymentType === PAYMENT_TYPE.BANK_TRANSFER && receipt.TransactionReference && <div>Ref: {receipt.TransactionReference}</div>}
                                  {receipt.BankName && <div className="text-muted-foreground">Bank: {receipt.BankName}</div>}
                                  {receipt.InvoiceNo && <div className="text-muted-foreground">Invoice: {receipt.InvoiceNo}</div>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>
                                    <span className="font-medium">Receipt:</span> {formatDate(receipt.ReceiptDate)}
                                  </div>
                                  {receipt.DepositDate && <div className="text-muted-foreground">Deposited: {formatDate(receipt.DepositDate)}</div>}
                                  {receipt.ClearanceDate && <div className="text-muted-foreground">Cleared: {formatDate(receipt.ClearanceDate)}</div>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{formatCurrency(receipt.ReceivedAmount)}</div>
                                {receipt.SecurityDepositAmount && receipt.SecurityDepositAmount > 0 && (
                                  <div className="text-sm text-muted-foreground">Security: {formatCurrency(receipt.SecurityDepositAmount)}</div>
                                )}
                                {receipt.IsAdvancePayment && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Advance
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {renderStatusBadge(receipt.PaymentStatus)}
                                  {receipt.IsPosted && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Posted
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {receipt.RequiresApproval ? (
                                    renderApprovalBadge(receipt.ApprovalStatus)
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-50">
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
                                <Badge variant="outline">{receipt.PaymentType}</Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewReceipt(receipt)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View details
                                    </DropdownMenuItem>

                                    {canEdit ? (
                                      <DropdownMenuItem onClick={() => handleEditReceipt(receipt)}>
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
                                          <p>Cannot edit approved receipts</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}

                                    {!receipt.IsPosted && canEdit && (
                                      <DropdownMenuItem onClick={() => openPostingDialog(receipt)}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Post
                                      </DropdownMenuItem>
                                    )}

                                    {isManager && receipt.RequiresApproval && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="font-medium text-muted-foreground">Approval Actions</DropdownMenuLabel>

                                        {receipt.ApprovalStatus === APPROVAL_STATUS.PENDING && (
                                          <>
                                            <DropdownMenuItem onClick={() => handleApproveReceipt(receipt)}>
                                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                              Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRejectReceipt(receipt)}>
                                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                              Reject
                                            </DropdownMenuItem>
                                          </>
                                        )}

                                        {receipt.ApprovalStatus !== APPROVAL_STATUS.PENDING && (
                                          <DropdownMenuItem onClick={() => handleResetApprovalStatus(receipt)}>
                                            <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                                            Reset Approval
                                          </DropdownMenuItem>
                                        )}
                                      </>
                                    )}

                                    <DropdownMenuSeparator />

                                    <DropdownMenuLabel className="font-medium text-muted-foreground">Change Status</DropdownMenuLabel>

                                    {paymentStatusOptions
                                      .filter((status) => status !== receipt.PaymentStatus)
                                      .map((status) => (
                                        <DropdownMenuItem key={status} onClick={() => openStatusChangeDialog(receipt, status)} disabled={!canEdit}>
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
                                                <p>Cannot change status of approved receipts</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                        </DropdownMenuItem>
                                      ))}

                                    <DropdownMenuSeparator />

                                    {canEdit ? (
                                      <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(receipt)}>
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
                                          <p>Cannot delete approved receipts</p>
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
          isOpen={showReceiptListPdfPreview}
          onClose={() => setShowReceiptListPdfPreview(false)}
          pdfBlob={receiptListPdf.data}
          title="Receipt List Report"
          isLoading={receiptListPdf.isLoading}
          error={receiptListPdf.error}
          onDownload={() => receiptListPdf.downloadCurrentPdf("Receipt_List_Report.pdf")}
          onRefresh={handlePreviewReceiptListReport}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteReceipt}
          title="Delete Receipt"
          description={
            selectedReceipt
              ? `Are you sure you want to delete receipt "${selectedReceipt.ReceiptNo}"? This action cannot be undone.`
              : "Are you sure you want to delete this receipt?"
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
          title="Change Receipt Status"
          description={
            selectedReceipt && newStatus
              ? `Are you sure you want to change the status of receipt "${selectedReceipt.ReceiptNo}" to "${newStatus}"?`
              : "Are you sure you want to change this receipt status?"
          }
          cancelText="Cancel"
          confirmText="Change Status"
          type="warning"
          loading={actionLoading}
        />

        {/* Single Receipt Posting Dialog */}
        <Dialog open={postingDialogOpen} onOpenChange={setPostingDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Post Receipt</DialogTitle>
              <DialogDescription>
                Post receipt {selectedReceipt?.ReceiptNo} to the general ledger
                <br />
                Amount: {formatCurrency(selectedReceipt?.ReceivedAmount)}
              </DialogDescription>
            </DialogHeader>
            <Form {...postingForm}>
              <form onSubmit={postingForm.handleSubmit(handlePostReceipt)} className="space-y-4">
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
                    description="Account to debit (typically Cash/Bank account)"
                  />
                  <FormField
                    form={postingForm}
                    name="creditAccountId"
                    label="Credit Account"
                    type="select"
                    options={accounts
                      .filter((acc) => acc.AccountCode.startsWith("1"))
                      .map((account) => ({
                        label: `${account.AccountCode} - ${account.AccountName}`,
                        value: account.AccountID.toString(),
                      }))}
                    placeholder="Select credit account"
                    required
                    description="Account to credit (typically Accounts Receivable)"
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
                        Post Receipt
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
              <DialogTitle>Bulk Post Receipts</DialogTitle>
              <DialogDescription>
                Post {selectedReceipts.size} selected receipts to the general ledger
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
                    description="Account to debit for all receipts"
                  />
                  <FormField
                    form={postingForm}
                    name="creditAccountId"
                    label="Credit Account"
                    type="select"
                    options={accounts
                      .filter((acc) => acc.AccountCode.startsWith("1"))
                      .map((account) => ({
                        label: `${account.AccountCode} - ${account.AccountName}`,
                        value: account.AccountID.toString(),
                      }))}
                    placeholder="Select credit account"
                    required
                    description="Account to credit for all receipts"
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
                        Post {selectedReceipts.size} Receipts
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Bulk Deposit Dialog */}
        <Dialog open={bulkDepositDialogOpen} onOpenChange={setBulkDepositDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mark Receipts as Deposited</DialogTitle>
              <DialogDescription>Mark {selectedReceipts.size} selected receipts as deposited to bank</DialogDescription>
            </DialogHeader>
            <Form {...bulkDepositForm}>
              <form onSubmit={bulkDepositForm.handleSubmit(handleBulkDeposit)} className="space-y-4">
                <FormField form={bulkDepositForm} name="depositDate" label="Deposit Date" type="date" required description="Date when receipts were deposited" />
                <FormField
                  form={bulkDepositForm}
                  name="depositBankId"
                  label="Deposit Bank"
                  type="select"
                  options={banks.map((bank) => ({
                    label: bank.BankName,
                    value: bank.BankID.toString(),
                  }))}
                  placeholder="Select deposit bank"
                  required
                  description="Bank where receipts were deposited"
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setBulkDepositDialogOpen(false)} disabled={actionLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Banknote className="mr-2 h-4 w-4" />
                        Mark as Deposited
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
              <DialogTitle>{approvalAction === "approve" ? "Bulk Approve Receipts" : "Bulk Reject Receipts"}</DialogTitle>
              <DialogDescription>
                {approvalAction === "approve"
                  ? `Approve ${selectedReceipts.size} selected receipts. Note: Once approved, receipts will be protected from modifications.`
                  : `Reject ${selectedReceipts.size} selected receipts with a reason.`}
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
                    {approvalAction === "approve" ? "Approve" : "Reject"} {selectedReceipts.size} Receipts
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

export default ContractReceiptList;
