// src/pages/paymentVoucher/PaymentVoucherList.tsx - Enhanced with Advanced Features
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Loader2,
  MoreHorizontal,
  Search,
  Plus,
  Receipt,
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
  RefreshCw,
  Download,
  Filter,
  X,
  ChevronDown,
  Settings,
  BarChart3,
  TrendingUp,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Shield,
  UserCheck,
  RotateCcw,
  Lock,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Separator } from "@/components/ui/separator";
import { paymentVoucherService } from "@/services/paymentVoucherService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { supplierService } from "@/services/supplierService";
import { PaymentVoucher, PaymentSearchFilters, PaymentStatus, PaymentType, ApprovalStatus, ApprovalAction } from "@/types/paymentVoucherTypes";
import { Company } from "@/services/companyService";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Supplier } from "@/types/supplierTypes";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";

// PDF Report Components
import { PdfPreviewModal, GenericPdfReport } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

// Types and interfaces
interface PaymentVoucherFilter {
  searchTerm: string;
  selectedCompanyId: string;
  selectedFiscalYearId: string;
  selectedStatus: string;
  selectedApprovalStatus: string;
  selectedSupplierId: string;
  selectedPaymentType: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface SortConfig {
  key: keyof PaymentVoucher | null;
  direction: "asc" | "desc";
}

interface PaymentVoucherListStats {
  total: number;
  draft: number;
  pending: number;
  paid: number;
  rejected: number;
  cancelled: number;
  reversed: number;
  totalValue: number;
  averageValue: number;
  approvalPending: number;
  approvalApproved: number;
  approvalRejected: number;
  paidProtected: number;
}

const PaymentVoucherList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<PaymentVoucher[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [suppliers, setSuppliers] = useState<Pick<Supplier, "SupplierID" | "SupplierNo" | "SupplierName">[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVouchers, setSelectedVouchers] = useState<Set<string>>(new Set());

  // Filter and sort state
  const [filters, setFilters] = useState<PaymentVoucherFilter>({
    searchTerm: searchParams.get("search") || "",
    selectedCompanyId: searchParams.get("company") || "",
    selectedFiscalYearId: searchParams.get("fiscalYear") || "",
    selectedStatus: searchParams.get("status") || "",
    selectedApprovalStatus: searchParams.get("approval") || "",
    selectedSupplierId: searchParams.get("supplier") || "",
    selectedPaymentType: searchParams.get("paymentType") || "",
    dateFrom: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    dateTo: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  // PDF Generation
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const paymentVoucherListPdf = useGenericPdfReport();

  // Approval state
  const [bulkApprovalAction, setBulkApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [bulkApprovalLoading, setBulkApprovalLoading] = useState(false);

  // Payment status and approval options
  const paymentStatusOptions = ["Draft", "Pending", "Paid", "Rejected", "Cancelled", "Reversed"];
  const approvalStatusOptions = ["Pending", "Approved", "Rejected"];

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
    if (filters.selectedCompanyId) params.set("company", filters.selectedCompanyId);
    if (filters.selectedFiscalYearId) params.set("fiscalYear", filters.selectedFiscalYearId);
    if (filters.selectedStatus) params.set("status", filters.selectedStatus);
    if (filters.selectedApprovalStatus) params.set("approval", filters.selectedApprovalStatus);
    if (filters.selectedSupplierId) params.set("supplier", filters.selectedSupplierId);
    if (filters.selectedPaymentType) params.set("paymentType", filters.selectedPaymentType);
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
      const vouchersData = await paymentVoucherService.getAllPaymentVouchers();
      setVouchers(vouchersData);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Failed to load payment vouchers");
    }
  };

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      const [companiesData, fiscalYearsData, suppliersData] = await Promise.all([
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getFiscalYearsForDropdown({ filterIsActive: true }),
        supplierService.getSuppliersForDropdown(true),
      ]);

      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);
      setSuppliers(suppliersData);
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
          voucher.SupplierName?.toLowerCase().includes(searchLower) ||
          voucher.PaidTo?.toLowerCase().includes(searchLower) ||
          voucher.Description?.toLowerCase().includes(searchLower) ||
          voucher.Narration?.toLowerCase().includes(searchLower) ||
          voucher.RefNo?.toLowerCase().includes(searchLower) ||
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
      filtered = filtered.filter((voucher) => voucher.PaymentStatus === filters.selectedStatus);
    }

    // Apply approval status filter
    if (filters.selectedApprovalStatus) {
      filtered = filtered.filter((voucher) => voucher.ApprovalStatus === filters.selectedApprovalStatus);
    }

    // Apply supplier filter
    if (filters.selectedSupplierId) {
      filtered = filtered.filter((voucher) => voucher.SupplierID?.toString() === filters.selectedSupplierId);
    }

    // Apply payment type filter
    if (filters.selectedPaymentType) {
      filtered = filtered.filter((voucher) => voucher.PaymentType === filters.selectedPaymentType);
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
  const handleFilterChange = (key: keyof PaymentVoucherFilter, value: any) => {
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
      selectedSupplierId: "",
      selectedPaymentType: "",
      dateFrom: undefined,
      dateTo: undefined,
    });
    setSearchParams(new URLSearchParams());
  };

  // Handle sorting
  const handleSort = (key: keyof PaymentVoucher) => {
    setSortConfig((prevSort) => ({
      key,
      direction: prevSort.key === key && prevSort.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Check if voucher can be edited
  const canEditVoucher = (voucher: PaymentVoucher) => {
    return voucher.PaymentStatus !== "Paid" && voucher.PaymentStatus !== "Reversed";
  };

  // Navigation handlers
  const handleAddVoucher = () => {
    navigate("/payment-vouchers/new");
  };

  const handleEditVoucher = (voucher: PaymentVoucher) => {
    if (!canEditVoucher(voucher)) {
      toast.error("Cannot edit paid or reversed vouchers. Please reverse the payment first if changes are needed.");
      return;
    }
    navigate(`/payment-vouchers/edit/${voucher.VoucherNo}`);
  };

  const handleViewVoucher = (voucher: PaymentVoucher) => {
    navigate(`/payment-vouchers/${voucher.VoucherNo}`);
  };

  // Analytics navigation
  const handleViewAnalytics = () => {
    navigate("/payment-vouchers/analytics");
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

    // Filter out paid/reversed vouchers
    const editableVouchers = Array.from(selectedVouchers).filter((voucherNo) => {
      const voucher = vouchers.find((v) => v.VoucherNo === voucherNo);
      return voucher && canEditVoucher(voucher);
    });

    if (editableVouchers.length === 0) {
      toast.error("Selected vouchers cannot be modified as they are paid or reversed.");
      return;
    }

    if (editableVouchers.length < selectedVouchers.size) {
      const skippedCount = selectedVouchers.size - editableVouchers.length;
      toast.warning(`${skippedCount} paid/reversed vouchers were skipped from status change.`);
    }

    try {
      // Note: This would need a bulk status change method in the service
      toast.info("Bulk status change functionality needs to be implemented in the service");
      setSelectedVouchers(new Set());
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
        if (!voucher) return Promise.resolve();

        return paymentVoucherService.approveOrRejectPaymentVoucher(
          voucherNo,
          voucher.CompanyID,
          action === "approve" ? ApprovalAction.APPROVE : ApprovalAction.REJECT,
          action === "reject" ? "Bulk rejection" : "Bulk approval"
        );
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
  const openDeleteDialog = (voucher: PaymentVoucher) => {
    if (!canEditVoucher(voucher)) {
      toast.error("Cannot delete paid or reversed vouchers. Please reverse the payment first if deletion is needed.");
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
      const response = await paymentVoucherService.deletePaymentVoucher(selectedVoucher.VoucherNo, selectedVoucher.CompanyID);

      if (response.success) {
        setVouchers(vouchers.filter((v) => v.VoucherNo !== selectedVoucher.VoucherNo));
        toast.success("Payment voucher deleted successfully");
      } else {
        toast.error(response.message || "Failed to delete payment voucher");
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast.error("Failed to delete payment voucher");
    } finally {
      closeDeleteDialog();
    }
  };

  // Change voucher status
  const handleChangeStatus = async (voucher: PaymentVoucher, newStatus: string) => {
    if (!canEditVoucher(voucher)) {
      toast.error("Cannot change status of paid or reversed vouchers.");
      return;
    }

    try {
      // Note: This would need a status change method in the service
      toast.info("Status change functionality needs to be implemented in the service");
    } catch (error) {
      console.error("Error changing voucher status:", error);
      toast.error("Failed to change voucher status");
    }
  };

  // Approval handlers for individual vouchers
  const handleApproveVoucher = async (voucher: PaymentVoucher) => {
    if (!isManager) return;

    try {
      const response = await paymentVoucherService.approveOrRejectPaymentVoucher(voucher.VoucherNo, voucher.CompanyID, ApprovalAction.APPROVE, "Quick approval from list");

      if (response.success) {
        setVouchers(vouchers.map((v) => (v.VoucherNo === voucher.VoucherNo ? { ...v, ApprovalStatus: "Approved" as ApprovalStatus } : v)));
        toast.success("Payment voucher approved successfully");
      } else {
        toast.error(response.message || "Failed to approve payment voucher");
      }
    } catch (error) {
      console.error("Error approving voucher:", error);
      toast.error("Failed to approve payment voucher");
    }
  };

  const handleRejectVoucher = async (voucher: PaymentVoucher) => {
    if (!isManager) return;

    try {
      const response = await paymentVoucherService.approveOrRejectPaymentVoucher(voucher.VoucherNo, voucher.CompanyID, ApprovalAction.REJECT, "Quick rejection from list");

      if (response.success) {
        setVouchers(vouchers.map((v) => (v.VoucherNo === voucher.VoucherNo ? { ...v, ApprovalStatus: "Rejected" as ApprovalStatus } : v)));
        toast.success("Payment voucher rejected successfully");
      } else {
        toast.error(response.message || "Failed to reject payment voucher");
      }
    } catch (error) {
      console.error("Error rejecting voucher:", error);
      toast.error("Failed to reject payment voucher");
    }
  };

  // Reverse voucher
  const handleReverseVoucher = async (voucher: PaymentVoucher) => {
    if (voucher.PaymentStatus !== "Paid") return;

    try {
      const response = await paymentVoucherService.reversePaymentVoucher(voucher.VoucherNo, voucher.CompanyID, "Manual reversal from list");

      if (response.success) {
        await fetchVouchers(); // Refresh to get updated data
        toast.success("Payment voucher reversed successfully");
      } else {
        toast.error(response.message || "Failed to reverse payment voucher");
      }
    } catch (error) {
      console.error("Error reversing voucher:", error);
      toast.error("Failed to reverse payment voucher");
    }
  };

  // PDF Generation handlers
  const filterEmptyParameters = (params: any) => {
    const filtered: any = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "" && value !== 0) {
        filtered[key] = value;
      }
    });
    return filtered;
  };

  const handleGenerateVoucherList = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCompanyID: filters.selectedCompanyId ? parseInt(filters.selectedCompanyId) : null,
      FilterFiscalYearID: filters.selectedFiscalYearId ? parseInt(filters.selectedFiscalYearId) : null,
      FilterStatus: filters.selectedStatus || "",
      FilterApprovalStatus: filters.selectedApprovalStatus || "",
      FilterSupplierID: filters.selectedSupplierId ? parseInt(filters.selectedSupplierId) : null,
      FilterPaymentType: filters.selectedPaymentType || "",
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
    };

    const filteredParameters = filterEmptyParameters(parameters);

    const response = await paymentVoucherListPdf.generateReport("payment-voucher-list", filteredParameters, {
      orientation: "Landscape",
      download: true,
      showToast: true,
      filename: `Payment_Voucher_List_${new Date().toISOString().split("T")[0]}.pdf`,
    });

    if (response.success) {
      toast.success("Payment voucher list report generated successfully");
    }
  };

  const handlePreviewVoucherList = async () => {
    const parameters = {
      SearchText: filters.searchTerm || "",
      FilterCompanyID: filters.selectedCompanyId ? parseInt(filters.selectedCompanyId) : null,
      FilterFiscalYearID: filters.selectedFiscalYearId ? parseInt(filters.selectedFiscalYearId) : null,
      FilterStatus: filters.selectedStatus || "",
      FilterApprovalStatus: filters.selectedApprovalStatus || "",
      FilterSupplierID: filters.selectedSupplierId ? parseInt(filters.selectedSupplierId) : null,
      FilterPaymentType: filters.selectedPaymentType || "",
      FilterFromDate: filters.dateFrom,
      FilterToDate: filters.dateTo,
    };

    const filteredParameters = filterEmptyParameters(parameters);

    setShowPdfPreview(true);

    const response = await paymentVoucherListPdf.generateReport("payment-voucher-list", filteredParameters, {
      orientation: "Landscape",
      download: false,
      showToast: false,
    });

    if (!response.success) {
      toast.error("Failed to generate payment voucher list preview");
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, icon: FileText, className: "bg-gray-100 text-gray-800" },
      Pending: { variant: "default" as const, icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Paid: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Rejected: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800" },
      Cancelled: { variant: "secondary" as const, icon: XCircle, className: "bg-orange-100 text-orange-800" },
      Reversed: { variant: "secondary" as const, icon: RotateCcw, className: "bg-purple-100 text-purple-800" },
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
  const renderApprovalBadge = (status: string) => {
    const approvalConfig = {
      Pending: { icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      Approved: { icon: CheckCircle, className: "bg-green-100 text-green-800" },
      Rejected: { icon: XCircle, className: "bg-red-100 text-red-800" },
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

  // Render payment type badge
  const renderPaymentTypeBadge = (paymentType: string) => {
    const paymentTypeConfig = {
      Cash: { icon: DollarSign, className: "bg-green-100 text-green-800" },
      Cheque: { icon: FileText, className: "bg-blue-100 text-blue-800" },
      "Bank Transfer": { icon: Building, className: "bg-purple-100 text-purple-800" },
      Online: { icon: CreditCard, className: "bg-orange-100 text-orange-800" },
      "Wire Transfer": { icon: Building, className: "bg-indigo-100 text-indigo-800" },
      "Credit Card": { icon: CreditCard, className: "bg-red-100 text-red-800" },
      "Debit Card": { icon: CreditCard, className: "bg-teal-100 text-teal-800" },
    };

    const config = paymentTypeConfig[paymentType as keyof typeof paymentTypeConfig] || paymentTypeConfig.Cash;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {paymentType}
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
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate statistics
  const stats: PaymentVoucherListStats = useMemo(() => {
    const filtered = filteredVouchers;
    return {
      total: filtered.length,
      draft: filtered.filter((v) => v.PaymentStatus === "Draft").length,
      pending: filtered.filter((v) => v.PaymentStatus === "Pending").length,
      paid: filtered.filter((v) => v.PaymentStatus === "Paid").length,
      rejected: filtered.filter((v) => v.PaymentStatus === "Rejected").length,
      cancelled: filtered.filter((v) => v.PaymentStatus === "Cancelled").length,
      reversed: filtered.filter((v) => v.PaymentStatus === "Reversed").length,
      totalValue: filtered.reduce((sum, v) => sum + (v.TotalAmount || 0), 0),
      averageValue: filtered.length > 0 ? filtered.reduce((sum, v) => sum + (v.TotalAmount || 0), 0) / filtered.length : 0,
      approvalPending: filtered.filter((v) => v.ApprovalStatus === "Pending").length,
      approvalApproved: filtered.filter((v) => v.ApprovalStatus === "Approved").length,
      approvalRejected: filtered.filter((v) => v.ApprovalStatus === "Rejected").length,
      paidProtected: filtered.filter((v) => v.PaymentStatus === "Paid").length,
    };
  }, [filteredVouchers]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm ||
    filters.selectedCompanyId ||
    filters.selectedFiscalYearId ||
    filters.selectedStatus ||
    filters.selectedApprovalStatus ||
    filters.selectedSupplierId ||
    filters.selectedPaymentType ||
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
            <h1 className="text-2xl font-semibold">Payment Voucher Management</h1>
            <p className="text-muted-foreground">Manage payment vouchers and supplier payments</p>
          </div>
          <div className="flex items-center gap-2">
            {isManager && stats.approvalPending > 0 && (
              <Button variant="outline" onClick={handleViewPendingApprovals} className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <Shield className="mr-2 h-4 w-4" />
                {stats.approvalPending} Pending Approval{stats.approvalPending !== 1 ? "s" : ""}
              </Button>
            )}
            {stats.paidProtected > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="bg-green-50 border-green-200 text-green-800">
                    <Lock className="mr-2 h-4 w-4" />
                    {stats.paidProtected} Protected
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.paidProtected} paid vouchers are protected from modifications</p>
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
              New Payment Voucher
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">{hasActiveFilters ? `of ${vouchers.length} total` : "vouchers"}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-muted-foreground">Draft</span>
              </div>
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
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
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Paid</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Rejected</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">Reversed</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.reversed}</div>
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
                  <div className="text-2xl font-bold text-green-600">{stats.paidProtected}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-muted-foreground">Approval Rejected</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{stats.approvalRejected}</div>
                </CardContent>
              </Card>
            </>
          )}

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
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">Average</span>
              </div>
              <div className="text-lg font-bold text-purple-600">{formatCurrency(stats.averageValue)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Payment Vouchers</CardTitle>
                <CardDescription>
                  {hasActiveFilters ? `Showing ${filteredVouchers.length} of ${vouchers.length} vouchers` : `Showing all ${vouchers.length} vouchers`}
                  {stats.paidProtected > 0 && <span className="ml-2 text-green-600">• {stats.paidProtected} paid vouchers are protected from modifications</span>}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* PDF Generation */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={paymentVoucherListPdf.isLoading}>
                      {paymentVoucherListPdf.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Export
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePreviewVoucherList}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGenerateVoucherList}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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
                      {paymentStatusOptions.map((status) => (
                        <DropdownMenuItem key={status} onClick={() => handleBulkStatusChange(status)}>
                          Set as {status}
                        </DropdownMenuItem>
                      ))}

                      {isManager && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Approval Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleBulkApproval("approve")} disabled={bulkApprovalLoading}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Approve Selected
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkApproval("reject")} disabled={bulkApprovalLoading}>
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
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

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4 p-4 bg-muted/50 rounded-lg">
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
                      {paymentStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
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
                        <SelectItem key={status} value={status}>
                          {status}
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

                  <Select value={filters.selectedPaymentType || "all"} onValueChange={(value) => handleFilterChange("selectedPaymentType", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Payment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {paymentVoucherService.getPaymentTypes().map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
                  {filters.selectedSupplierId && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedSupplierId", "")}>
                      Supplier: {suppliers.find((s) => s.SupplierID.toString() === filters.selectedSupplierId)?.SupplierName}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.selectedPaymentType && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedPaymentType", "")}>
                      Type: {filters.selectedPaymentType} <X className="ml-1 h-3 w-3" />
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
                    <p className="text-muted-foreground mb-4">No vouchers found matching your criteria.</p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No payment vouchers found. Create your first voucher to get started.</p>
                    <Button onClick={handleAddVoucher}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Payment Voucher
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
                      <TableHead>Company</TableHead>
                      <TableHead>Supplier/Payee</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("TotalAmount")}>
                        <div className="flex items-center gap-1">
                          Amount
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
                      <TableHead className="cursor-pointer" onClick={() => handleSort("PaymentStatus")}>
                        <div className="flex items-center gap-1">
                          Status
                          {sortConfig.key === "PaymentStatus" ? (
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
                      const isPaid = voucher.PaymentStatus === "Paid";
                      const canEdit = canEditVoucher(voucher);

                      return (
                        <TableRow
                          key={voucher.VoucherNo}
                          className={cn("hover:bg-muted/50 transition-colors", selectedVouchers.has(voucher.VoucherNo) && "bg-accent/50", isPaid && "bg-green-50/30")}
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
                              {isPaid && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Lock className="h-3 w-3 text-green-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Protected - Paid vouchers cannot be modified</p>
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
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{voucher.SupplierName || voucher.PaidTo || "—"}</div>
                                {voucher.RefNo && <div className="text-sm text-muted-foreground">Ref: {voucher.RefNo}</div>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {renderPaymentTypeBadge(voucher.PaymentType)}
                            {voucher.ChequeNo && <div className="text-sm text-muted-foreground mt-1">Cheque: {voucher.ChequeNo}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(voucher.TotalAmount, voucher.CurrencyName)}</div>
                            <div className="text-sm text-muted-foreground">{voucher.CurrencyName}</div>
                          </TableCell>
                          <TableCell>{renderStatusBadge(voucher.PaymentStatus || "Draft")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {voucher.RequiresApproval ? (
                                renderApprovalBadge(voucher.ApprovalStatus || "Pending")
                              ) : (
                                <Badge variant="outline" className="bg-gray-50">
                                  No Approval Required
                                </Badge>
                              )}
                              {voucher.ApprovalStatus === "Approved" && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Shield className="h-3 w-3 text-green-600 ml-1" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Approved and ready for payment</p>
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
                                      <p>Cannot edit paid or reversed vouchers</p>
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
                                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRejectVoucher(voucher)}>
                                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                          Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {voucher.ApprovalStatus !== "Pending" && (
                                      <DropdownMenuItem onClick={() => navigate(`/payment-vouchers/${voucher.VoucherNo}`)}>
                                        <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                                        Reset Approval
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}

                                {voucher.PaymentStatus === "Paid" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleReverseVoucher(voucher)}>
                                      <RotateCcw className="mr-2 h-4 w-4 text-purple-600" />
                                      Reverse Payment
                                    </DropdownMenuItem>
                                  </>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuLabel className="font-medium text-muted-foreground">Change Status</DropdownMenuLabel>

                                {paymentStatusOptions
                                  .filter((status) => status !== voucher.PaymentStatus)
                                  .map((status) => (
                                    <DropdownMenuItem key={status} onClick={() => handleChangeStatus(voucher, status)} disabled={!canEdit}>
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
                                            <p>Cannot change status of paid or reversed vouchers</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </DropdownMenuItem>
                                  ))}

                                <DropdownMenuSeparator />

                                {canEdit ? (
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => openDeleteDialog(voucher)}
                                    disabled={voucher.PaymentStatus === "Paid" || voucher.PaymentStatus === "Reversed"}
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
                                      <p>Cannot delete paid or reversed vouchers</p>
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

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          pdfBlob={paymentVoucherListPdf.data}
          title="Payment Voucher List Report"
          isLoading={paymentVoucherListPdf.isLoading}
          error={paymentVoucherListPdf.error}
          onDownload={() => paymentVoucherListPdf.downloadCurrentPdf("Payment_Voucher_List_Report.pdf")}
          onRefresh={handlePreviewVoucherList}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteVoucher}
          title="Delete Payment Voucher"
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

export default PaymentVoucherList;
