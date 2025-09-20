// src/pages/journalVoucher/JournalVoucherList.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  RefreshCw,
  Filter,
  X,
  ChevronDown,
  BarChart3,
  TrendingUp,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Shield,
  RotateCcw,
  Lock,
  AlertCircle,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Company, companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { supplierService } from "@/services/supplierService";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";
import { useCompanyChangeHandler } from "@/hooks/useCompanyChangeHandler";
import { ApprovalAction, ApprovalStatus, JournalVoucher } from "@/types/journalVoucherTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Supplier } from "@/types/supplierTypes";
import { journalVoucherService } from "@/services/journalVoucherService";

// Types and interfaces
interface JournalVoucherFilter {
  searchTerm: string;
  selectedCompanyId: string;
  selectedFiscalYearId: string;
  selectedStatus: string;
  selectedApprovalStatus: string;
  selectedJournalType: string;
  selectedSupplierId: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface SortConfig {
  key: keyof JournalVoucher | null;
  direction: "asc" | "desc";
}

interface JournalVoucherListStats {
  total: number;
  draft: number;
  pending: number;
  posted: number;
  rejected: number;
  totalValue: number;
  averageValue: number;
  approvalPending: number;
  approvalApproved: number;
  approvalRejected: number;
  approvedProtected: number;
}

const JournalVoucherList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [vouchers, setVouchers] = useState<JournalVoucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<JournalVoucher[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<JournalVoucher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVouchers, setSelectedVouchers] = useState<Set<string>>(new Set());
  const [isCompanyChanging, setIsCompanyChanging] = useState(false);

  // Filter and sort state
  const [filters, setFilters] = useState<JournalVoucherFilter>({
    searchTerm: searchParams.get("search") || "",
    selectedCompanyId: searchParams.get("company") || "",
    selectedFiscalYearId: searchParams.get("fiscalYear") || "",
    selectedStatus: searchParams.get("status") || "",
    selectedApprovalStatus: searchParams.get("approval") || "",
    selectedJournalType: searchParams.get("journalType") || "",
    selectedSupplierId: searchParams.get("supplier") || "",
    dateFrom: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    dateTo: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  // Approval state
  const [bulkApprovalAction, setBulkApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [bulkApprovalLoading, setBulkApprovalLoading] = useState(false);

  // Journal status and approval options
  const journalStatusOptions = journalVoucherService.getJournalStatuses();
  const approvalStatusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
  ];
  const journalTypeOptions = journalVoucherService.getJournalTypeOptions();

  // Check if user is manager
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Handle company changes with the custom hook
  const { currentCompanyId, currentCompanyName } = useCompanyChangeHandler({
    onCompanyChange: async (newCompanyId: string, oldCompanyId: string | null) => {
      setIsCompanyChanging(true);

      try {
        // Clear existing data
        setVouchers([]);
        setFilteredVouchers([]);
        setSelectedVouchers(new Set());

        // Clear filters and URL parameters
        const clearedFilters = {
          searchTerm: "",
          selectedCompanyId: "",
          selectedFiscalYearId: "",
          selectedStatus: "",
          selectedApprovalStatus: "",
          selectedJournalType: "",
          selectedSupplierId: "",
          dateFrom: undefined,
          dateTo: undefined,
        };
        setFilters(clearedFilters);
        setSearchParams(new URLSearchParams());

        // Load data for the new company
        if (newCompanyId) {
          const companyIdNum = parseInt(newCompanyId);

          const [vouchersData, companiesData, fiscalYearsData, suppliersData] = await Promise.all([
            journalVoucherService.getAllJournalVouchers({ companyId: companyIdNum }),
            companyService.getCompaniesForDropdown?.(true) || [],
            fiscalYearService.getFiscalYearsForDropdown?.({ filterIsActive: true }) || [],
            supplierService.getSuppliersForDropdown?.(true) || [],
          ]);

          setVouchers(vouchersData);
          setCompanies(companiesData || []);
          setFiscalYears(fiscalYearsData || []);
          setSuppliers(suppliersData || []);
        }
      } catch (error) {
        console.error("Error handling company change in JournalVoucherList:", error);
        toast.error("Failed to load journal vouchers for the selected company");
      } finally {
        setIsCompanyChanging(false);
      }
    },
    enableLogging: true,
    showNotifications: true,
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
    if (filters.selectedStatus) params.set("status", filters.selectedStatus);
    if (filters.selectedApprovalStatus) params.set("approval", filters.selectedApprovalStatus);
    if (filters.selectedJournalType) params.set("journalType", filters.selectedJournalType);
    if (filters.selectedSupplierId) params.set("supplier", filters.selectedSupplierId);
    if (filters.dateFrom) params.set("from", filters.dateFrom.toISOString().split("T")[0]);
    if (filters.dateTo) params.set("to", filters.dateTo.toISOString().split("T")[0]);

    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Apply filters and sorting whenever vouchers or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [vouchers, filters, sortConfig]);

  // Initialize component data
  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchVouchers(), fetchReferenceData()]);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all vouchers
  const fetchVouchers = async () => {
    try {
      const companyId = currentCompanyId ? parseInt(currentCompanyId) : undefined;
      const vouchersData = await journalVoucherService.getAllJournalVouchers({ companyId });
      setVouchers(vouchersData);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Failed to load journal vouchers");
    }
  };

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [companiesData, fiscalYearsData, suppliersData] = await Promise.all([
        companyService.getCompaniesForDropdown?.(true) || [],
        fiscalYearService.getFiscalYearsForDropdown?.({ filterIsActive: true }) || [],
        supplierService.getSuppliersForDropdown?.(true) || [],
      ]);

      setCompanies(companiesData || []);
      setFiscalYears(fiscalYearsData || []);
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchVouchers();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...vouchers];

    // Apply text search
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (voucher) =>
          voucher.VoucherNo?.toLowerCase().includes(searchLower) ||
          voucher.Description?.toLowerCase().includes(searchLower) ||
          voucher.Narration?.toLowerCase().includes(searchLower) ||
          voucher.RefNo?.toLowerCase().includes(searchLower) ||
          voucher.PaidTo?.toLowerCase().includes(searchLower) ||
          voucher.ChequeNo?.toLowerCase().includes(searchLower)
      );
    }

    // Apply company filter
    if (filters.selectedCompanyId) {
      filtered = filtered.filter((voucher) => voucher.CompanyID.toString() === filters.selectedCompanyId);
    }

    // Apply fiscal year filter
    if (filters.selectedFiscalYearId) {
      filtered = filtered.filter((voucher) => voucher.FiscalYearID.toString() === filters.selectedFiscalYearId);
    }

    // Apply status filter
    if (filters.selectedStatus) {
      filtered = filtered.filter((voucher) => voucher.PostingStatus === filters.selectedStatus);
    }

    // Apply approval status filter
    if (filters.selectedApprovalStatus) {
      filtered = filtered.filter((voucher) => voucher.ApprovalStatus === filters.selectedApprovalStatus);
    }

    // Apply journal type filter
    if (filters.selectedJournalType) {
      filtered = filtered.filter((voucher) => voucher.JournalType === filters.selectedJournalType);
    }

    // Apply supplier filter
    if (filters.selectedSupplierId) {
      filtered = filtered.filter((voucher) => voucher.SupplierID?.toString() === filters.selectedSupplierId);
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter((voucher) => new Date(voucher.TransactionDate) >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((voucher) => new Date(voucher.TransactionDate) <= filters.dateTo!);
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

    setFilteredVouchers(filtered);
  }, [vouchers, filters, sortConfig]);

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
  const handleFilterChange = (key: keyof JournalVoucherFilter, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      selectedCompanyId: "",
      selectedFiscalYearId: "",
      selectedStatus: "",
      selectedApprovalStatus: "",
      selectedJournalType: "",
      selectedSupplierId: "",
      dateFrom: undefined,
      dateTo: undefined,
    });
    setSearchParams(new URLSearchParams());
  };

  // Handle sorting
  const handleSort = (key: keyof JournalVoucher) => {
    setSortConfig((prevSort) => ({
      key,
      direction: prevSort.key === key && prevSort.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Check if voucher can be edited
  const canEditVoucher = (voucher: JournalVoucher) => {
    return journalVoucherService.canEditVoucher(voucher);
  };

  // Navigation handlers
  const handleAddVoucher = () => {
    navigate("/journal-vouchers/new");
  };

  const handleEditVoucher = (voucher: JournalVoucher) => {
    if (!canEditVoucher(voucher)) {
      toast.error("Cannot edit posted or approved vouchers. Please reset approval status first if changes are needed.");
      return;
    }
    navigate(`/journal-vouchers/edit/${voucher.VoucherNo}`);
  };

  const handleViewVoucher = (voucher: JournalVoucher) => {
    navigate(`/journal-vouchers/${voucher.VoucherNo}`);
  };

  // Analytics navigation
  const handleViewAnalytics = () => {
    navigate("/journal-vouchers/analytics");
  };

  const handleViewPendingApprovals = () => {
    setFilters((prev) => ({ ...prev, selectedApprovalStatus: "Pending" }));
    setShowFilters(true);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVouchers(new Set(filteredVouchers.map((v) => v.VoucherNo)));
    } else {
      setSelectedVouchers(new Set());
    }
  };

  const handleSelectVoucher = (voucherNo: string, checked: boolean) => {
    const newSelection = new Set(selectedVouchers);
    if (checked) {
      newSelection.add(voucherNo);
    } else {
      newSelection.delete(voucherNo);
    }
    setSelectedVouchers(newSelection);
  };

  // Bulk operations
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedVouchers.size === 0) return;

    // Filter out vouchers that cannot be edited
    const editableVouchers = Array.from(selectedVouchers).filter((voucherNo) => {
      const voucher = vouchers.find((v) => v.VoucherNo === voucherNo);
      return voucher && canEditVoucher(voucher);
    });

    if (editableVouchers.length === 0) {
      toast.error("Selected vouchers cannot be modified as they are posted or approved.");
      return;
    }

    if (editableVouchers.length < selectedVouchers.size) {
      const skippedCount = selectedVouchers.size - editableVouchers.length;
      toast.warning(`${skippedCount} vouchers were skipped from status change.`);
    }

    try {
      // Note: This would require a bulk update method in the service
      // For now, we'll update them individually
      const promises = editableVouchers.map(async (voucherNo) => {
        const voucher = vouchers.find((v) => v.VoucherNo === voucherNo);
        if (voucher) {
          // Would need to implement bulk status change in service
          // return journalVoucherService.changeVoucherStatus(voucher.VoucherNo, voucher.CompanyID, newStatus);
        }
      });

      await Promise.all(promises);

      // Refresh data
      await fetchVouchers();
      setSelectedVouchers(new Set());
      toast.success(`${editableVouchers.length} vouchers updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update voucher statuses");
    }
  };

  // Bulk approval operations - Manager only
  const handleBulkApproval = async (action: "approve" | "reject") => {
    if (!isManager || selectedVouchers.size === 0) return;

    const pendingVouchers = Array.from(selectedVouchers).filter((voucherNo) => {
      const voucher = vouchers.find((v) => v.VoucherNo === voucherNo);
      return voucher?.ApprovalStatus === "Pending";
    });

    if (pendingVouchers.length === 0) {
      toast.error("No pending vouchers selected for approval action");
      return;
    }

    setBulkApprovalLoading(true);

    try {
      const promises = pendingVouchers.map((voucherNo) => {
        const voucher = vouchers.find((v) => v.VoucherNo === voucherNo);
        if (voucher) {
          return journalVoucherService.approveOrRejectJournalVoucher(
            voucher.VoucherNo,
            voucher.CompanyID,
            action === "approve" ? ApprovalAction.APPROVE : ApprovalAction.REJECT,
            action === "approve" ? "Bulk approval" : "Bulk rejection"
          );
        }
      });

      await Promise.all(promises);

      // Refresh vouchers to get updated approval status
      await fetchVouchers();

      setSelectedVouchers(new Set());
      toast.success(`${pendingVouchers.length} vouchers ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} vouchers`);
    } finally {
      setBulkApprovalLoading(false);
    }
  };

  // Delete voucher handlers
  const openDeleteDialog = (voucher: JournalVoucher) => {
    if (!canEditVoucher(voucher)) {
      toast.error("Cannot delete posted or approved vouchers.");
      return;
    }
    setSelectedVoucher(voucher);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedVoucher(null);
  };

  const handleDeleteVoucher = async () => {
    if (!selectedVoucher) return;

    try {
      const response = await journalVoucherService.deleteJournalVoucher(selectedVoucher.VoucherNo, selectedVoucher.CompanyID);

      if (response.success) {
        setVouchers(vouchers.filter((v) => v.VoucherNo !== selectedVoucher.VoucherNo));
        toast.success("Journal voucher deleted successfully");
      } else {
        toast.error(response.message || "Failed to delete journal voucher");
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast.error("Failed to delete journal voucher");
    } finally {
      closeDeleteDialog();
    }
  };

  // Approval handlers for individual vouchers
  const handleApproveVoucher = async (voucher: JournalVoucher) => {
    if (!isManager) return;

    try {
      const response = await journalVoucherService.approveOrRejectJournalVoucher(voucher.VoucherNo, voucher.CompanyID, ApprovalAction.APPROVE, "Approved from list view");

      if (response.success) {
        setVouchers(vouchers.map((v) => (v.VoucherNo === voucher.VoucherNo ? { ...v, ApprovalStatus: ApprovalStatus.APPROVED } : v)));
        toast.success("Journal voucher approved successfully");
      } else {
        toast.error(response.message || "Failed to approve journal voucher");
      }
    } catch (error) {
      console.error("Error approving voucher:", error);
      toast.error("Failed to approve journal voucher");
    }
  };

  const handleRejectVoucher = async (voucher: JournalVoucher) => {
    if (!isManager) return;

    try {
      const response = await journalVoucherService.approveOrRejectJournalVoucher(voucher.VoucherNo, voucher.CompanyID, ApprovalAction.REJECT, "Quick rejection from list");

      if (response.success) {
        setVouchers(vouchers.map((v) => (v.VoucherNo === voucher.VoucherNo ? { ...v, ApprovalStatus: ApprovalStatus.REJECTED } : v)));
        toast.success("Journal voucher rejected successfully");
      } else {
        toast.error(response.message || "Failed to reject journal voucher");
      }
    } catch (error) {
      console.error("Error rejecting voucher:", error);
      toast.error("Failed to reject journal voucher");
    }
  };

  // Render status badge - Updated for dark mode
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
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      Posted: {
        variant: "default" as const,
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      Rejected: {
        variant: "destructive" as const,
        icon: XCircle,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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

  // Render approval status badge - Updated for dark mode
  const renderApprovalBadge = (status: string) => {
    const approvalConfig = {
      Pending: {
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      Approved: {
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      Rejected: {
        icon: XCircle,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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

  // Render journal type badge - Updated for dark mode
  const renderJournalTypeBadge = (journalType: string) => {
    const typeConfig = {
      General: {
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
      Adjusting: {
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      },
      Closing: {
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      },
      Reversing: {
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
    };

    const config = typeConfig[journalType as keyof typeof typeConfig] || typeConfig.General;

    return (
      <Badge variant="outline" className={config.className}>
        {journalType}
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
  const formatCurrency = (amount?: number, currencyCode?: string) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED", //currencyCode ||
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate statistics
  const stats: JournalVoucherListStats = useMemo(() => {
    const filtered = filteredVouchers;
    return {
      total: filtered.length,
      draft: filtered.filter((v) => v.PostingStatus === "Draft").length,
      pending: filtered.filter((v) => v.PostingStatus === "Pending").length,
      posted: filtered.filter((v) => v.PostingStatus === "Posted").length,
      rejected: filtered.filter((v) => v.PostingStatus === "Rejected").length,
      totalValue: filtered.reduce((sum, v) => sum + (v.TotalDebit || 0), 0),
      averageValue: filtered.length > 0 ? filtered.reduce((sum, v) => sum + (v.TotalDebit || 0), 0) / filtered.length : 0,
      approvalPending: filtered.filter((v) => v.ApprovalStatus === "Pending").length,
      approvalApproved: filtered.filter((v) => v.ApprovalStatus === "Approved").length,
      approvalRejected: filtered.filter((v) => v.ApprovalStatus === "Rejected").length,
      approvedProtected: filtered.filter((v) => v.ApprovalStatus === "Approved").length,
    };
  }, [filteredVouchers]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm ||
    filters.selectedCompanyId ||
    filters.selectedFiscalYearId ||
    filters.selectedStatus ||
    filters.selectedApprovalStatus ||
    filters.selectedJournalType ||
    filters.selectedSupplierId ||
    filters.dateFrom ||
    filters.dateTo;

  if (loading || isCompanyChanging) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {isCompanyChanging && (
          <div className="text-center">
            <p className="text-muted-foreground">Switching to {currentCompanyName}...</p>
            <p className="text-sm text-muted-foreground">Loading journal vouchers for the selected company</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Journal Voucher Management</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">Manage journal entries and accounting transactions</p>
              {currentCompanyName && (
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Building className="mr-1 h-3 w-3" />
                  {currentCompanyName}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isManager && stats.approvalPending > 0 && (
              <Button
                variant="outline"
                onClick={handleViewPendingApprovals}
                className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
              >
                <Shield className="mr-2 h-4 w-4" />
                {stats.approvalPending} Pending Approval{stats.approvalPending !== 1 ? "s" : ""}
              </Button>
            )}
            {stats.approvedProtected > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-green-50 border-green-200 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    {stats.approvedProtected} Protected
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.approvedProtected} approved vouchers are protected from modifications</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Button variant="outline" onClick={handleViewAnalytics}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button onClick={handleAddVoucher}>
              <Plus className="mr-2 h-4 w-4" />
              New Journal Voucher
            </Button>
          </div>
        </div>

        {/* Summary Statistics - Updated for dark mode */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4">
          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">{hasActiveFilters ? `of ${vouchers.length} total` : "vouchers"}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-muted-foreground">Draft</span>
              </div>
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.draft}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-muted-foreground">Posted</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.posted}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-muted-foreground">Rejected</span>
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
            </CardContent>
          </Card>

          {isManager && (
            <>
              <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm text-muted-foreground">Approval Pending</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.approvalPending}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-muted-foreground">Approved</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approvalApproved}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-muted-foreground">Protected</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approvedProtected}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-muted-foreground">Approval Rejected</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.approvalRejected}</div>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-muted-foreground">Total Value</span>
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.totalValue)}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-muted-foreground">Average</span>
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(stats.averageValue)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Journal Vouchers</CardTitle>
                <CardDescription>
                  {hasActiveFilters ? `Showing ${filteredVouchers.length} of ${vouchers.length} vouchers` : `Showing all ${vouchers.length} vouchers`}
                  {stats.approvedProtected > 0 && (
                    <span className="ml-2 text-green-600 dark:text-green-400">• {stats.approvedProtected} approved vouchers are protected from modifications</span>
                  )}
                  {currentCompanyName && <span className="ml-2 text-blue-600 dark:text-blue-400">• Filtered by {currentCompanyName}</span>}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Bulk Operations */}
                {selectedVouchers.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Bulk Actions ({selectedVouchers.size})
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      {journalStatusOptions.map((status) => (
                        <DropdownMenuItem key={status.value} onClick={() => handleBulkStatusChange(status.value)}>
                          Set as {status.label}
                        </DropdownMenuItem>
                      ))}

                      {isManager && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Approval Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleBulkApproval("approve")} disabled={bulkApprovalLoading}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                            Approve Selected
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkApproval("reject")} disabled={bulkApprovalLoading}>
                            <XCircle className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                            Reject Selected
                          </DropdownMenuItem>
                        </>
                      )}
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
            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
              {/* Search Bar */}
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search vouchers..." className="pl-9" defaultValue={filters.searchTerm} onChange={handleSearchChange} />
              </div>

              {/* Advanced Filters - Updated for dark mode */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4 p-4 bg-muted/50 rounded-lg dark:bg-muted/20">
                  <Select value={filters.selectedFiscalYearId || "all"} onValueChange={(value) => handleFilterChange("selectedFiscalYearId", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Fiscal Year" />
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

                  <Select value={filters.selectedStatus || "all"} onValueChange={(value) => handleFilterChange("selectedStatus", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {journalStatusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.selectedApprovalStatus || "all"} onValueChange={(value) => handleFilterChange("selectedApprovalStatus", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Approval Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Approval Status</SelectItem>
                      {approvalStatusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.selectedJournalType || "all"} onValueChange={(value) => handleFilterChange("selectedJournalType", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Journal Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {journalTypeOptions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.selectedSupplierId || "all"} onValueChange={(value) => handleFilterChange("selectedSupplierId", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.SupplierID} value={supplier.SupplierID.toString()}>
                          {supplier.SupplierName}
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
                  {filters.selectedStatus && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedStatus", "")}>
                      Status: {filters.selectedStatus} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.selectedApprovalStatus && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedApprovalStatus", "")}>
                      Approval: {filters.selectedApprovalStatus} <X className="ml-1 h-3 w-3" />
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

            {/* Vouchers Table */}
            {filteredVouchers.length === 0 ? (
              <div className="text-center py-10">
                {hasActiveFilters ? (
                  <div>
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No journal vouchers found matching your criteria.</p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No journal vouchers found. Create your first voucher to get started.</p>
                    <Button onClick={handleAddVoucher}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Journal Voucher
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
                          checked={selectedVouchers.size === filteredVouchers.length && filteredVouchers.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all vouchers"
                        />
                      </TableHead>
                      <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort("VoucherNo")}>
                        <div className="flex items-center gap-1">
                          Voucher #
                          {sortConfig.key === "VoucherNo" ? (
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
                      <TableHead className="cursor-pointer" onClick={() => handleSort("TransactionDate")}>
                        <div className="flex items-center gap-1">
                          Date
                          {sortConfig.key === "TransactionDate" ? (
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
                      <TableHead className="cursor-pointer" onClick={() => handleSort("CompanyName")}>
                        <div className="flex items-center gap-1">
                          Company
                          {sortConfig.key === "CompanyName" ? (
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
                      <TableHead>Description</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("TotalDebit")}>
                        <div className="flex items-center gap-1">
                          Amount
                          {sortConfig.key === "TotalDebit" ? (
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
                      <TableHead className="cursor-pointer" onClick={() => handleSort("PostingStatus")}>
                        <div className="flex items-center gap-1">
                          Status
                          {sortConfig.key === "PostingStatus" ? (
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
                      <TableHead className="cursor-pointer" onClick={() => handleSort("ApprovalStatus")}>
                        <div className="flex items-center gap-1">
                          Approval
                          {sortConfig.key === "ApprovalStatus" ? (
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
                      <TableHead>Created By</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVouchers.map((voucher) => {
                      const isApproved = voucher.ApprovalStatus === "Approved";
                      const canEdit = canEditVoucher(voucher);

                      return (
                        <TableRow
                          key={voucher.VoucherNo}
                          className={cn(
                            "hover:bg-muted/50 transition-colors",
                            selectedVouchers.has(voucher.VoucherNo) && "bg-accent/50",
                            isApproved && "bg-green-50/30 dark:bg-green-900/10"
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedVouchers.has(voucher.VoucherNo)}
                              onCheckedChange={(checked) => handleSelectVoucher(voucher.VoucherNo, checked as boolean)}
                              aria-label={`Select voucher ${voucher.VoucherNo}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">{voucher.VoucherNo}</div>
                                <div className="text-sm text-muted-foreground">{voucher.VoucherType}</div>
                              </div>
                              {isApproved && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Lock className="h-3 w-3 text-green-600 dark:text-green-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Protected - Approved vouchers cannot be modified</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDate(voucher.TransactionDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{voucher.CompanyName || `Company ${voucher.CompanyID}`}</div>
                            <div className="text-sm text-muted-foreground">{voucher.FYDescription}</div>
                          </TableCell>
                          <TableCell>
                            {voucher.JournalType && renderJournalTypeBadge(voucher.JournalType)}
                            {voucher.SupplierName && <div className="text-sm text-muted-foreground mt-1">Supplier: {voucher.SupplierName}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">{voucher.Description || voucher.Narration || "—"}</div>
                            {voucher.PaidTo && <div className="text-sm text-muted-foreground">Paid to: {voucher.PaidTo}</div>}
                            {voucher.RefNo && <div className="text-sm text-muted-foreground">Ref: {voucher.RefNo}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(voucher.TotalDebit, voucher.CurrencyName)}</div>
                            <div className="text-sm text-muted-foreground">{voucher.CurrencyName}</div>
                          </TableCell>
                          <TableCell>{renderStatusBadge(voucher.PostingStatus || "Draft")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {voucher.RequiresApproval ? (
                                renderApprovalBadge(voucher.ApprovalStatus || "Pending")
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800/50">
                                  No Approval Required
                                </Badge>
                              )}
                              {isApproved && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Shield className="h-3 w-3 text-green-600 dark:text-green-400 ml-1" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Protected from modifications</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {voucher.CreatedBy && <div>{voucher.CreatedBy}</div>}
                              {voucher.CreatedOn && <div className="text-muted-foreground">{formatDate(voucher.CreatedOn)}</div>}
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
                                <DropdownMenuItem onClick={() => handleViewVoucher(voucher)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>

                                {canEdit ? (
                                  <DropdownMenuItem onClick={() => handleEditVoucher(voucher)}>
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
                                      <p>Cannot edit posted or approved vouchers</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                {isManager && voucher.RequiresApproval && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="font-medium text-muted-foreground">Approval Actions</DropdownMenuLabel>

                                    {voucher.ApprovalStatus === "Pending" && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleApproveVoucher(voucher)}>
                                          <CheckCircle className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRejectVoucher(voucher)}>
                                          <XCircle className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                                          Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {voucher.ApprovalStatus !== "Pending" && (
                                      <DropdownMenuItem onClick={() => navigate(`/journal-vouchers/${voucher.VoucherNo}`)}>
                                        <RotateCcw className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        Reset Approval
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}

                                <DropdownMenuSeparator />

                                {canEdit ? (
                                  <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400"
                                    onClick={() => openDeleteDialog(voucher)}
                                    disabled={voucher.PostingStatus === "Posted"}
                                  >
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
                                      <p>Cannot delete posted or approved vouchers</p>
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
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteVoucher}
          title="Delete Journal Voucher"
          description={
            selectedVoucher
              ? `Are you sure you want to delete voucher "${selectedVoucher.VoucherNo}"? This action cannot be undone.`
              : "Are you sure you want to delete this voucher?"
          }
          cancelText="Cancel"
          confirmText="Delete"
          type="danger"
        />
      </div>
    </TooltipProvider>
  );
};

export default JournalVoucherList;
