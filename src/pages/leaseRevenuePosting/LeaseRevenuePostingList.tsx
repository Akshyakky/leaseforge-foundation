// src/pages/leaseRevenuePosting/LeaseRevenuePostingList.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Loader2,
  MoreHorizontal,
  Search,
  Plus,
  Receipt,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
  HandCoins,
  Send,
  RotateCcw,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
  AlertCircle,
  Shield,
  UserCheck,
  TrendingUp,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Services and types
import { leaseRevenuePostingService } from "@/services/leaseRevenuePostingService";
import { accountService } from "@/services/accountService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { propertyService } from "@/services/propertyService";
import { customerService } from "@/services/customerService";
import { currencyService } from "@/services/currencyService";

import {
  LeaseRevenueTransaction,
  PostedLeaseRevenueTransaction,
  SelectedTransaction,
  LeaseRevenueFilters,
  PostingRequest,
  ReversalRequest,
  ApprovalRequest,
  PostingResponse,
  ApprovalResponse,
  Account,
  Company,
  FiscalYear,
  Currency,
  ApprovalStatus,
  ApprovalAction,
  PostingStatus,
  LeaseRevenueStatistics,
  PendingApprovalItem,
} from "@/types/leaseRevenuePostingTypes";

// Form handling
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField } from "@/components/forms/FormField";
import { Form } from "@/components/ui/form";

// Utilities
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";

// Form validation schema
const postingSchema = z.object({
  postingDate: z.date({ required_error: "Posting date is required" }),
  debitAccountId: z.string().min(1, "Debit account is required"),
  creditAccountId: z.string().min(1, "Credit account is required"),
  narration: z.string().optional(),
  referenceNo: z.string().optional(),
  exchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").optional(),
  currencyId: z.string().optional(),
});

type PostingFormValues = z.infer<typeof postingSchema>;

// Component interfaces
interface LeaseRevenueFiltersState {
  searchTerm: string;
  selectedCompanyId: string;
  selectedFiscalYearId: string;
  selectedPropertyId: string;
  selectedCustomerId: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface LeaseRevenueStats {
  unposted: {
    total: number;
    totalAmount: number;
    selected: number;
    selectedAmount: number;
  };
  posted: {
    total: number;
    totalAmount: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
  };
}

const LeaseRevenuePostingList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [unpostedTransactions, setUnpostedTransactions] = useState<LeaseRevenueTransaction[]>([]);
  const [postedTransactions, setPostedTransactions] = useState<PostedLeaseRevenueTransaction[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([]);

  // Reference data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Loading and action states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("unposted");

  // Selection state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectedPosting, setSelectedPosting] = useState<PostedLeaseRevenueTransaction | null>(null);

  // Dialog states
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState("");
  const [approvalAction, setApprovalAction] = useState<ApprovalAction | null>(null);
  const [approvalComments, setApprovalComments] = useState("");

  // Filter states
  const [filters, setFilters] = useState<LeaseRevenueFiltersState>({
    searchTerm: searchParams.get("search") || "",
    selectedCompanyId: searchParams.get("company") || "",
    selectedFiscalYearId: searchParams.get("fiscalYear") || "",
    selectedPropertyId: searchParams.get("property") || "",
    selectedCustomerId: searchParams.get("customer") || "",
    dateFrom: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    dateTo: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Check if user is manager/admin
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Posting form
  const postingForm = useForm<PostingFormValues>({
    resolver: zodResolver(postingSchema),
    defaultValues: {
      postingDate: new Date(),
      debitAccountId: "",
      creditAccountId: "",
      narration: "",
      referenceNo: "",
      exchangeRate: 1,
      currencyId: "",
    },
  });

  // Initialize data on component mount
  useEffect(() => {
    initializeData();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchTerm) params.set("search", filters.searchTerm);
    if (filters.selectedCompanyId) params.set("company", filters.selectedCompanyId);
    if (filters.selectedFiscalYearId) params.set("fiscalYear", filters.selectedFiscalYearId);
    if (filters.selectedPropertyId) params.set("property", filters.selectedPropertyId);
    if (filters.selectedCustomerId) params.set("customer", filters.selectedCustomerId);
    if (filters.dateFrom) params.set("from", filters.dateFrom.toISOString().split("T")[0]);
    if (filters.dateTo) params.set("to", filters.dateTo.toISOString().split("T")[0]);

    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Apply filters when they change
  useEffect(() => {
    if (!loading) {
      fetchTransactionsData();
    }
  }, [filters]);

  // Initialize component data
  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchReferenceData(), fetchTransactionsData()]);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [companiesData, fiscalYearsData, accountsData, currenciesData, propertiesData, customersData] = await Promise.all([
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
        accountService.getAllAccounts(),
        currencyService.getAllCurrencies(),
        propertyService.getAllProperties(),
        customerService.getAllCustomers(),
      ]);

      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
      setAccounts(accountsData.filter((acc) => acc.IsActive && acc.IsPostable));
      setCurrencies(currenciesData);
      setProperties(propertiesData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  // Fetch transactions data
  const fetchTransactionsData = async () => {
    try {
      const apiFilters: LeaseRevenueFilters = {
        CompanyID: filters.selectedCompanyId ? parseInt(filters.selectedCompanyId) : undefined,
        FiscalYearID: filters.selectedFiscalYearId ? parseInt(filters.selectedFiscalYearId) : undefined,
        PropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : undefined,
        CustomerID: filters.selectedCustomerId ? parseInt(filters.selectedCustomerId) : undefined,
        PeriodFromDate: filters.dateFrom,
        PeriodToDate: filters.dateTo,
      };

      const [unpostedData, postedData, pendingApprovalsData] = await Promise.all([
        leaseRevenuePostingService.getUnpostedTransactions(apiFilters),
        leaseRevenuePostingService.getPostedTransactions(apiFilters),
        isManager
          ? leaseRevenuePostingService.getPendingApprovals({
              companyId: apiFilters.CompanyID,
              fiscalYearId: apiFilters.FiscalYearID,
            })
          : Promise.resolve([]),
      ]);

      // Apply search filter client-side
      let filteredUnposted = unpostedData;
      let filteredPosted = postedData;

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredUnposted = unpostedData.filter(
          (t) =>
            t.TransactionNo?.toLowerCase().includes(searchLower) ||
            t.CustomerName?.toLowerCase().includes(searchLower) ||
            t.Property?.toLowerCase().includes(searchLower) ||
            t.UnitNo?.toLowerCase().includes(searchLower)
        );

        filteredPosted = postedData.filter(
          (t) =>
            t.TransactionNo?.toLowerCase().includes(searchLower) ||
            t.CustomerName?.toLowerCase().includes(searchLower) ||
            t.Property?.toLowerCase().includes(searchLower) ||
            t.UnitNo?.toLowerCase().includes(searchLower) ||
            t.VoucherNo?.toLowerCase().includes(searchLower)
        );
      }

      setUnpostedTransactions(filteredUnposted);
      setPostedTransactions(filteredPosted);
      setPendingApprovals(pendingApprovalsData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTransactionsData();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

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
  const handleFilterChange = (key: keyof LeaseRevenueFiltersState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      selectedCompanyId: "",
      selectedFiscalYearId: "",
      selectedPropertyId: "",
      selectedCustomerId: "",
      dateFrom: undefined,
      dateTo: undefined,
    });
    setSelectedTransactions(new Set());
    setSearchParams(new URLSearchParams());
  };

  // Selection handlers
  const handleSelectTransaction = (transactionKey: string, checked: boolean) => {
    const newSelection = new Set(selectedTransactions);
    if (checked) {
      newSelection.add(transactionKey);
    } else {
      newSelection.delete(transactionKey);
    }
    setSelectedTransactions(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = unpostedTransactions.map((t) => `${t.TransactionType}-${t.TransactionID}`);
      setSelectedTransactions(new Set(allKeys));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  // Posting handlers
  const handlePostTransactions = async (data: PostingFormValues) => {
    if (selectedTransactions.size === 0) {
      toast.error("No transactions selected for posting");
      return;
    }

    setActionLoading(true);
    try {
      const selectedTxns: SelectedTransaction[] = Array.from(selectedTransactions).map((key) => {
        const [type, id] = key.split("-");
        const transaction = unpostedTransactions.find((t) => t.TransactionType === type && t.TransactionID.toString() === id);

        if (!transaction) {
          throw new Error(`Transaction not found: ${key}`);
        }

        return {
          TransactionType: type as "Invoice" | "Receipt",
          TransactionID: parseInt(id),
          PostingAmount: transaction.PostingAmount,
          DebitAccountID: parseInt(data.debitAccountId),
          CreditAccountID: parseInt(data.creditAccountId),
          Narration: data.narration || transaction.BalanceNarration || "",
        };
      });

      const postingRequest: PostingRequest = {
        PostingDate: data.postingDate,
        DebitAccountID: parseInt(data.debitAccountId),
        CreditAccountID: parseInt(data.creditAccountId),
        Narration: data.narration,
        ReferenceNo: data.referenceNo,
        ExchangeRate: data.exchangeRate || 1,
        CurrencyID: data.currencyId ? parseInt(data.currencyId) : undefined,
        CompanyID: filters.selectedCompanyId ? parseInt(filters.selectedCompanyId) : 1,
        FiscalYearID: filters.selectedFiscalYearId ? parseInt(filters.selectedFiscalYearId) : 1,
        SelectedTransactions: selectedTxns,
      };

      const result = await leaseRevenuePostingService.postSelectedTransactions(postingRequest);

      if (result.success) {
        toast.success(`Posted ${result.PostedCount || selectedTxns.length} transactions successfully`);
        if (result.FailedCount && result.FailedCount > 0) {
          toast.warning(`${result.FailedCount} transactions failed to post`);
        }

        // Reset selection and refresh data
        setSelectedTransactions(new Set());
        setPostingDialogOpen(false);
        postingForm.reset();
        await fetchTransactionsData();
      } else {
        toast.error(result.message || "Failed to post transactions");
      }
    } catch (error) {
      console.error("Error posting transactions:", error);
      toast.error("Failed to post transactions");
    } finally {
      setActionLoading(false);
    }
  };

  // Reversal handlers
  const handleReversePosting = async () => {
    if (!selectedPosting || !reversalReason.trim()) {
      toast.error("Reversal reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const reversalRequest: ReversalRequest = {
        PostingID: selectedPosting.PostingID,
        ReversalReason: reversalReason.trim(),
      };

      const result = await leaseRevenuePostingService.reverseTransaction(reversalRequest);

      if (result.success) {
        toast.success("Transaction reversed successfully");
        setReversalDialogOpen(false);
        setReversalReason("");
        setSelectedPosting(null);
        await fetchTransactionsData();
      } else {
        toast.error(result.message || "Failed to reverse transaction");
      }
    } catch (error) {
      console.error("Error reversing transaction:", error);
      toast.error("Failed to reverse transaction");
    } finally {
      setActionLoading(false);
    }
  };

  // Approval handlers
  const handleApprovalAction = async () => {
    if (!selectedPosting || !approvalAction) {
      toast.error("Invalid approval action");
      return;
    }

    if (approvalAction === ApprovalAction.REJECT && !approvalComments.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const approvalRequest: ApprovalRequest = {
        PostingID: selectedPosting.PostingID,
        ApprovalAction: approvalAction,
        ApprovalComments: approvalComments.trim(),
        RejectionReason: approvalAction === ApprovalAction.REJECT ? approvalComments.trim() : undefined,
      };

      const result = await leaseRevenuePostingService.approveOrRejectPosting(approvalRequest);

      if (result.success) {
        toast.success(`Transaction ${approvalAction.toLowerCase()}d successfully`);
        setApprovalDialogOpen(false);
        setApprovalComments("");
        setApprovalAction(null);
        setSelectedPosting(null);
        await fetchTransactionsData();
      } else {
        toast.error(result.message || `Failed to ${approvalAction.toLowerCase()} transaction`);
      }
    } catch (error) {
      console.error(`Error ${approvalAction.toLowerCase()}ing transaction:`, error);
      toast.error(`Failed to ${approvalAction.toLowerCase()} transaction`);
    } finally {
      setActionLoading(false);
    }
  };

  // Navigation handlers
  const handleViewTransactionDetails = (transactionType: "Invoice" | "Receipt", transactionId: number) => {
    navigate(`/lease-revenue-posting/details/${transactionType}/${transactionId}`);
  };

  const handleViewPostingDetails = (postingId: number) => {
    navigate(`/lease-revenue-posting/posting-details/${postingId}`);
  };

  const handleViewPendingApprovals = () => {
    setActiveTab("posted");
    setFilters((prev) => ({ ...prev, selectedApprovalStatus: ApprovalStatus.PENDING }));
  };

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
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

  // Render status badge
  const renderStatusBadge = (isPosted: boolean, isReversed?: boolean, approvalStatus?: ApprovalStatus) => {
    if (isReversed) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          <XCircle className="w-3 h-3 mr-1" />
          Reversed
        </Badge>
      );
    }

    if (isPosted) {
      if (approvalStatus === ApprovalStatus.APPROVED) {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Posted & Approved
          </Badge>
        );
      } else if (approvalStatus === ApprovalStatus.PENDING) {
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Posted - Pending Approval
          </Badge>
        );
      } else if (approvalStatus === ApprovalStatus.REJECTED) {
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Posted - Rejected
          </Badge>
        );
      } else {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Posted
          </Badge>
        );
      }
    }

    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Unposted
      </Badge>
    );
  };

  // Calculate statistics
  const stats: LeaseRevenueStats = useMemo(() => {
    const unpostedStats = {
      total: unpostedTransactions.length,
      totalAmount: unpostedTransactions.reduce((sum, t) => sum + t.PostingAmount, 0),
      selected: selectedTransactions.size,
      selectedAmount: Array.from(selectedTransactions).reduce((sum, key) => {
        const [type, id] = key.split("-");
        const transaction = unpostedTransactions.find((t) => t.TransactionType === type && t.TransactionID.toString() === id);
        return sum + (transaction?.PostingAmount || 0);
      }, 0),
    };

    const postedStats = {
      total: postedTransactions.length,
      totalAmount: postedTransactions.reduce((sum, t) => sum + (t.DebitAmount || t.CreditAmount), 0),
      pendingApproval: postedTransactions.filter((t) => t.ApprovalStatus === ApprovalStatus.PENDING).length,
      approved: postedTransactions.filter((t) => t.ApprovalStatus === ApprovalStatus.APPROVED).length,
      rejected: postedTransactions.filter((t) => t.ApprovalStatus === ApprovalStatus.REJECTED).length,
    };

    return { unposted: unpostedStats, posted: postedStats };
  }, [unpostedTransactions, postedTransactions, selectedTransactions]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm ||
    filters.selectedCompanyId ||
    filters.selectedFiscalYearId ||
    filters.selectedPropertyId ||
    filters.selectedCustomerId ||
    filters.dateFrom ||
    filters.dateTo;

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
            <h1 className="text-2xl font-semibold">Lease Revenue Posting</h1>
            <p className="text-muted-foreground">Post lease revenue transactions to the general ledger</p>
          </div>
          <div className="flex items-center gap-2">
            {isManager && pendingApprovals.length > 0 && (
              <Button variant="outline" onClick={handleViewPendingApprovals} className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <Shield className="mr-2 h-4 w-4" />
                {pendingApprovals.length} Pending Approval{pendingApprovals.length !== 1 ? "s" : ""}
              </Button>
            )}
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button onClick={() => setPostingDialogOpen(true)} disabled={selectedTransactions.size === 0}>
              <Send className="mr-2 h-4 w-4" />
              Post Selected ({selectedTransactions.size})
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Unposted</span>
              </div>
              <div className="text-2xl font-bold">{stats.unposted.total}</div>
              <div className="text-xs text-muted-foreground">{formatCurrency(stats.unposted.totalAmount)}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Selected</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.unposted.selected}</div>
              <div className="text-xs text-muted-foreground">{formatCurrency(stats.unposted.selectedAmount)}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Posted</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.posted.total}</div>
              <div className="text-xs text-muted-foreground">{formatCurrency(stats.posted.totalAmount)}</div>
            </CardContent>
          </Card>

          {isManager && (
            <>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-muted-foreground">Pending</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.posted.pendingApproval}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Approved</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{stats.posted.approved}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-muted-foreground">Rejected</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{stats.posted.rejected}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lease Revenue Transactions</CardTitle>
                <CardDescription>
                  Manage lease revenue posting operations
                  {stats.posted.pendingApproval > 0 && <span className="ml-2 text-yellow-600">• {stats.posted.pendingApproval} transactions pending approval</span>}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedTransactions.size > 0 && (
                  <Button onClick={() => setPostingDialogOpen(true)}>
                    <Send className="mr-2 h-4 w-4" />
                    Post Selected ({selectedTransactions.size})
                  </Button>
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
            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
              {/* Search Bar */}
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search transactions..." className="pl-9" defaultValue={filters.searchTerm} onChange={handleSearchChange} />
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg">
                  <Select value={filters.selectedCompanyId || "all"} onValueChange={(value) => handleFilterChange("selectedCompanyId", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.CompanyID} value={company.CompanyID.toString()}>
                          {company.CompanyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.selectedFiscalYearId || "all"} onValueChange={(value) => handleFilterChange("selectedFiscalYearId", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Fiscal year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {fiscalYears.map((fy) => (
                        <SelectItem key={fy.FiscalYearID} value={fy.FiscalYearID.toString()}>
                          {fy.FYDescription}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.selectedPropertyId || "all"} onValueChange={(value) => handleFilterChange("selectedPropertyId", value === "all" ? "" : value)}>
                    <SelectTrigger>
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

                  <Select value={filters.selectedCustomerId || "all"} onValueChange={(value) => handleFilterChange("selectedCustomerId", value === "all" ? "" : value)}>
                    <SelectTrigger>
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

                  <DatePicker value={filters.dateFrom} onChange={(date) => handleFilterChange("dateFrom", date)} placeholder="From date" />

                  <DatePicker value={filters.dateTo} onChange={(date) => handleFilterChange("dateTo", date)} placeholder="To date" />

                  <div className="flex items-center gap-2">
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
                  {filters.selectedCompanyId && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedCompanyId", "")}>
                      Company: {companies.find((c) => c.CompanyID.toString() === filters.selectedCompanyId)?.CompanyName}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.selectedFiscalYearId && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedFiscalYearId", "")}>
                      FY: {fiscalYears.find((fy) => fy.FiscalYearID.toString() === filters.selectedFiscalYearId)?.FYDescription}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.selectedPropertyId && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedPropertyId", "")}>
                      Property: {properties.find((p) => p.PropertyID.toString() === filters.selectedPropertyId)?.PropertyName}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.selectedCustomerId && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedCustomerId", "")}>
                      Customer: {customers.find((c) => c.CustomerID.toString() === filters.selectedCustomerId)?.CustomerFullName}
                      <X className="ml-1 h-3 w-3" />
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

            {/* Tabs for Unposted and Posted */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unposted">Unposted Transactions ({stats.unposted.total})</TabsTrigger>
                <TabsTrigger value="posted">
                  Posted Transactions ({stats.posted.total})
                  {stats.posted.pendingApproval > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {stats.posted.pendingApproval}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Unposted Transactions Tab */}
              <TabsContent value="unposted">
                {unpostedTransactions.length === 0 ? (
                  <div className="text-center py-10">
                    {hasActiveFilters ? (
                      <div>
                        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">No unposted transactions found matching your criteria.</p>
                        <Button variant="outline" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">No unposted transactions found.</p>
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
                              checked={selectedTransactions.size === unpostedTransactions.length && unpostedTransactions.length > 0}
                              onCheckedChange={handleSelectAll}
                              aria-label="Select all transactions"
                            />
                          </TableHead>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Property/Unit</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unpostedTransactions.map((transaction) => {
                          const transactionKey = `${transaction.TransactionType}-${transaction.TransactionID}`;
                          const isSelected = selectedTransactions.has(transactionKey);

                          return (
                            <TableRow key={transactionKey} className={cn("hover:bg-muted/50 transition-colors", isSelected && "bg-accent/50")}>
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectTransaction(transactionKey, checked as boolean)}
                                  aria-label={`Select transaction ${transaction.TransactionNo}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{transaction.TransactionNo}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {transaction.TransactionType}
                                  </Badge>
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(transaction.TransactionDate)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{transaction.Property}</div>
                                <div className="text-sm text-muted-foreground">Unit: {transaction.UnitNo}</div>
                              </TableCell>
                              <TableCell>
                                <div>{transaction.CustomerName}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {formatDate(transaction.StartDate)} - {formatDate(transaction.EndDate)}
                                </div>
                                <div className="text-xs text-muted-foreground">{transaction.TotalLeaseDays} days</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{formatCurrency(transaction.PostingAmount)}</div>
                                {transaction.BalanceAmount !== transaction.PostingAmount && (
                                  <div className="text-sm text-muted-foreground">Balance: {formatCurrency(transaction.BalanceAmount)}</div>
                                )}
                              </TableCell>
                              <TableCell>{renderStatusBadge(transaction.IsPosted)}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewTransactionDetails(transaction.TransactionType, transaction.TransactionID)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View details
                                    </DropdownMenuItem>
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

              {/* Posted Transactions Tab */}
              <TabsContent value="posted">
                {postedTransactions.length === 0 ? (
                  <div className="text-center py-10">
                    {hasActiveFilters ? (
                      <div>
                        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">No posted transactions found matching your criteria.</p>
                        <Button variant="outline" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">No posted transactions found.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Voucher</TableHead>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Property/Unit</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Accounts</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {postedTransactions.map((posting) => {
                          const isPending = posting.ApprovalStatus === ApprovalStatus.PENDING;
                          const canApprove = isManager && isPending && !posting.IsReversed;
                          const canReverse = isManager && posting.ApprovalStatus === ApprovalStatus.APPROVED && !posting.IsReversed;

                          return (
                            <TableRow
                              key={posting.PostingID}
                              className={cn(
                                "hover:bg-muted/50 transition-colors",
                                isPending && "bg-yellow-50/30",
                                posting.ApprovalStatus === ApprovalStatus.APPROVED && "bg-green-50/30"
                              )}
                            >
                              <TableCell>
                                <div className="font-medium">{posting.VoucherNo}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(posting.PostingDate)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{posting.TransactionNo}</div>
                                <div className="text-sm text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {posting.TransactionType}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{posting.Property}</div>
                                <div className="text-sm text-muted-foreground">Unit: {posting.UnitNo}</div>
                              </TableCell>
                              <TableCell>
                                <div>{posting.CustomerName}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>
                                    Dr: {posting.DebitAccountCode} - {posting.DebitAccountName}
                                  </div>
                                  <div>
                                    Cr: {posting.CreditAccountCode} - {posting.CreditAccountName}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{formatCurrency(posting.DebitAmount || posting.CreditAmount)}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {renderStatusBadge(true, posting.IsReversed, posting.ApprovalStatus)}
                                  {isPending && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Clock className="h-3 w-3 text-yellow-600 ml-1" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Pending approval</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
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
                                    <DropdownMenuItem onClick={() => handleViewPostingDetails(posting.PostingID)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View details
                                    </DropdownMenuItem>

                                    {canApprove && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="font-medium text-muted-foreground">Approval Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedPosting(posting);
                                            setApprovalAction(ApprovalAction.APPROVE);
                                            setApprovalDialogOpen(true);
                                          }}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedPosting(posting);
                                            setApprovalAction(ApprovalAction.REJECT);
                                            setApprovalDialogOpen(true);
                                          }}
                                          className="text-red-500"
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {canReverse && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedPosting(posting);
                                            setReversalDialogOpen(true);
                                          }}
                                          className="text-red-500"
                                        >
                                          <RotateCcw className="mr-2 h-4 w-4" />
                                          Reverse
                                        </DropdownMenuItem>
                                      </>
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

        {/* Posting Dialog */}
        <Dialog open={postingDialogOpen} onOpenChange={setPostingDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Post Selected Transactions</DialogTitle>
              <DialogDescription>Configure posting details for {selectedTransactions.size} selected transactions</DialogDescription>
            </DialogHeader>

            <Form {...postingForm}>
              <form onSubmit={postingForm.handleSubmit(handlePostTransactions)} className="space-y-4">
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

                {currencies.length > 0 && (
                  <FormField
                    form={postingForm}
                    name="currencyId"
                    label="Currency"
                    type="select"
                    options={currencies.map((currency) => ({
                      label: `${currency.CurrencyCode} - ${currency.CurrencyName}`,
                      value: currency.CurrencyID.toString(),
                    }))}
                    placeholder="Select currency"
                    description="Transaction currency"
                  />
                )}

                <FormField
                  form={postingForm}
                  name="narration"
                  label="Narration"
                  type="textarea"
                  placeholder="Enter posting narration"
                  description="Description for the posting entries"
                />

                <FormField form={postingForm} name="referenceNo" label="Reference Number" placeholder="Enter reference number" description="Optional reference for the posting" />

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
                        Post Transactions
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Reversal Dialog */}
        <Dialog open={reversalDialogOpen} onOpenChange={setReversalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reverse Posted Transaction</DialogTitle>
              <DialogDescription>Are you sure you want to reverse this posting? This will create offsetting entries.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reversal-reason">Reversal Reason *</Label>
                <Textarea
                  id="reversal-reason"
                  placeholder="Enter reason for reversal"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReversalDialogOpen(false);
                  setReversalReason("");
                  setSelectedPosting(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleReversePosting} disabled={actionLoading || !reversalReason.trim()} variant="destructive">
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reverse Transaction
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approval Dialog */}
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{approvalAction === ApprovalAction.APPROVE ? "Approve" : "Reject"} Transaction</DialogTitle>
              <DialogDescription>
                {approvalAction === ApprovalAction.APPROVE
                  ? "Are you sure you want to approve this posting?"
                  : "Are you sure you want to reject this posting? Please provide a reason."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="approval-comments">{approvalAction === ApprovalAction.APPROVE ? "Comments (Optional)" : "Rejection Reason *"}</Label>
                <Textarea
                  id="approval-comments"
                  placeholder={approvalAction === ApprovalAction.APPROVE ? "Enter approval comments" : "Enter reason for rejection"}
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                  required={approvalAction === ApprovalAction.REJECT}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setApprovalDialogOpen(false);
                  setApprovalComments("");
                  setApprovalAction(null);
                  setSelectedPosting(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprovalAction}
                disabled={actionLoading || (approvalAction === ApprovalAction.REJECT && !approvalComments.trim())}
                variant={approvalAction === ApprovalAction.APPROVE ? "default" : "destructive"}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {approvalAction === ApprovalAction.APPROVE ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === ApprovalAction.APPROVE ? "Approve" : "Reject"} Transaction
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

export default LeaseRevenuePostingList;
