// src/pages/lease-revenue/LeaseRevenueList.tsx - Enhanced with Dark Mode Support
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
  FileText,
  Building,
  Calendar,
  Eye,
  Edit,
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
  DollarSign,
  Calculator,
  Receipt,
  RotateCcw,
  History,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Separator } from "@/components/ui/separator";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";

// Services and Types
import { leaseRevenueService } from "@/services/leaseRevenueService";
import { propertyService } from "@/services/propertyService";
import { unitService } from "@/services/unitService";
import { customerService } from "@/services/customerService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { LeaseRevenueData, LeaseRevenueSearchParams, PostedLeaseRevenueEntry, LeaseRevenueStatistics, PostingResult } from "@/types/leaseRevenueTypes";

// PDF Components
import { PdfPreviewModal } from "@/components/pdf/PdfReportComponents";
import { useGenericPdfReport } from "@/hooks/usePdfReports";

// Types and interfaces
interface LeaseRevenueFilter {
  searchTerm: string;
  selectedPropertyId: string;
  selectedUnitId: string;
  selectedCustomerId: string;
  selectedContractStatus: string;
  postingStatus: string; // all, posted, unposted
  periodFrom?: Date;
  periodTo?: Date;
  includePMUnits: boolean;
}

interface SortConfig {
  key: keyof LeaseRevenueData | null;
  direction: "asc" | "desc";
}

interface LeaseRevenueListStats {
  totalUnits: number;
  totalRevenue: number;
  postedRevenue: number;
  unpostedRevenue: number;
  averageRentPerDay: number;
  totalContracts: number;
  postedCount: number;
  unpostedCount: number;
}

const LeaseRevenueList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  // State variables
  const [leaseRevenueData, setLeaseRevenueData] = useState<LeaseRevenueData[]>([]);
  const [postedEntries, setPostedEntries] = useState<PostedLeaseRevenueEntry[]>([]);
  const [filteredData, setFilteredData] = useState<LeaseRevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"unposted" | "posted">("unposted");

  // Reference data
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<any>(null);

  // Selection and bulk operations
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isReverseDialogOpen, setIsReverseDialogOpen] = useState(false);
  const [selectedVoucherForReversal, setSelectedVoucherForReversal] = useState<string>("");

  // Filter and sort state
  const [filters, setFilters] = useState<LeaseRevenueFilter>({
    searchTerm: searchParams.get("search") || "",
    selectedPropertyId: searchParams.get("property") || "",
    selectedUnitId: searchParams.get("unit") || "",
    selectedCustomerId: searchParams.get("customer") || "",
    selectedContractStatus: searchParams.get("status") || "",
    postingStatus: searchParams.get("posting") || "all",
    periodFrom: searchParams.get("from") ? new Date(searchParams.get("from")!) : startOfMonth(new Date()),
    periodTo: searchParams.get("to") ? new Date(searchParams.get("to")!) : endOfMonth(new Date()),
    includePMUnits: searchParams.get("includePM") === "true",
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  // PDF Generation
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const leaseRevenuePdf = useGenericPdfReport();

  // Contract status options
  const contractStatusOptions = ["Active", "Completed", "Expired", "Cancelled", "Terminated"];
  const postingStatusOptions = [
    { label: "All", value: "all" },
    { label: "Unposted Only", value: "unposted" },
    { label: "Posted Only", value: "posted" },
  ];

  // Initialize data on component mount
  useEffect(() => {
    initializeData();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchTerm) params.set("search", filters.searchTerm);
    if (filters.selectedPropertyId) params.set("property", filters.selectedPropertyId);
    if (filters.selectedUnitId) params.set("unit", filters.selectedUnitId);
    if (filters.selectedCustomerId) params.set("customer", filters.selectedCustomerId);
    if (filters.selectedContractStatus) params.set("status", filters.selectedContractStatus);
    if (filters.postingStatus !== "all") params.set("posting", filters.postingStatus);
    if (filters.periodFrom) params.set("from", filters.periodFrom.toISOString().split("T")[0]);
    if (filters.periodTo) params.set("to", filters.periodTo.toISOString().split("T")[0]);
    if (filters.includePMUnits) params.set("includePM", "true");

    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Apply filters and sorting whenever data or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [leaseRevenueData, filters, sortConfig]);

  // Refresh data when period changes
  useEffect(() => {
    if (filters.periodFrom && filters.periodTo) {
      fetchLeaseRevenueData();
      if (activeTab === "posted") {
        fetchPostedEntries();
      }
    }
  }, [filters.periodFrom, filters.periodTo, filters.includePMUnits]);

  // Initialize component data
  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchReferenceData()]);
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany?.CompanyID && selectedFiscalYear?.FiscalYearID) {
      fetchLeaseRevenueData();
      if (activeTab === "posted") {
        fetchPostedEntries();
      }
    }
  }, [selectedCompany, selectedFiscalYear]);

  // Fetch reference data for dropdowns
  const fetchReferenceData = async () => {
    try {
      const [propertiesData, unitsData, customersData, companiesData, fiscalYearsData] = await Promise.all([
        propertyService.getAllProperties(),
        unitService.getAllUnits(),
        customerService.getAllCustomers(),
        companyService.getCompaniesForDropdown(true),
        fiscalYearService.getAllFiscalYears(),
      ]);

      setProperties(propertiesData);
      setUnits(unitsData);
      setCustomers(customersData);
      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);

      // Set default company and fiscal year
      if (companiesData.length > 0) {
        const defaultCompany = companiesData[0];
        setSelectedCompany(defaultCompany);

        // Get current fiscal year for the company
        try {
          const currentFY = await fiscalYearService.getCurrentFiscalYear(defaultCompany.CompanyID);
          if (currentFY) {
            setSelectedFiscalYear(currentFY);
          } else if (fiscalYearsData.length > 0) {
            const companyFY = fiscalYearsData.find((fy) => fy.CompanyID === defaultCompany.CompanyID);
            if (companyFY) {
              setSelectedFiscalYear(companyFY);
            }
          }
        } catch (error) {
          console.error("Error fetching current fiscal year:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
      toast.error("Failed to load reference data");
    }
  };

  // Fetch lease revenue data
  const fetchLeaseRevenueData = async () => {
    if (!selectedCompany?.CompanyID || !selectedFiscalYear?.FiscalYearID || !filters.periodFrom || !filters.periodTo) {
      return;
    }

    try {
      const searchRequest = {
        PropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : undefined,
        UnitID: filters.selectedUnitId ? parseInt(filters.selectedUnitId) : undefined,
        PeriodFrom: filters.periodFrom,
        PeriodTo: filters.periodTo,
        IncludePMUnits: filters.includePMUnits,
        ShowUnpostedOnly: filters.postingStatus === "unposted",
        CompanyID: selectedCompany.CompanyID,
        FiscalYearID: selectedFiscalYear.FiscalYearID,
      };

      const data = await leaseRevenueService.getLeaseRevenueData(searchRequest);
      setLeaseRevenueData(data);
    } catch (error) {
      console.error("Error fetching lease revenue data:", error);
      toast.error("Failed to load lease revenue data");
    }
  };

  // Fetch posted entries
  const fetchPostedEntries = async () => {
    if (!selectedCompany?.CompanyID || !filters.periodFrom || !filters.periodTo) {
      return;
    }

    try {
      const searchParams = {
        FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : undefined,
        FilterUnitID: filters.selectedUnitId ? parseInt(filters.selectedUnitId) : undefined,
        PeriodFrom: filters.periodFrom,
        PeriodTo: filters.periodTo,
        CompanyID: selectedCompany.CompanyID,
      };

      const data = await leaseRevenueService.getPostedEntries(searchParams);
      setPostedEntries(data);
    } catch (error) {
      console.error("Error fetching posted entries:", error);
      toast.error("Failed to load posted entries");
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchLeaseRevenueData();
      if (activeTab === "posted") {
        await fetchPostedEntries();
      }
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...leaseRevenueData];

    // Apply text search
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.LeaseNo?.toLowerCase().includes(searchLower) ||
          item.Property?.toLowerCase().includes(searchLower) ||
          item.UnitNo?.toLowerCase().includes(searchLower) ||
          item.CustomerName?.toLowerCase().includes(searchLower) ||
          item.Narration?.toLowerCase().includes(searchLower)
      );
    }

    // Apply property filter
    if (filters.selectedPropertyId) {
      // This would need PropertyID in the response data
      filtered = filtered.filter((item) => {
        const property = properties.find((p) => p.PropertyName === item.Property);
        return property?.PropertyID.toString() === filters.selectedPropertyId;
      });
    }

    // Apply unit filter
    if (filters.selectedUnitId) {
      // This would need UnitID in the response data
      filtered = filtered.filter((item) => {
        const unit = units.find((u) => u.UnitNo === item.UnitNo);
        return unit?.UnitID.toString() === filters.selectedUnitId;
      });
    }

    // Apply contract status filter
    if (filters.selectedContractStatus) {
      filtered = filtered.filter((item) => item.ContractStatus === filters.selectedContractStatus);
    }

    // Apply posting status filter
    if (filters.postingStatus === "posted") {
      filtered = filtered.filter((item) => item.IsPosted === true);
    } else if (filters.postingStatus === "unposted") {
      filtered = filtered.filter((item) => item.IsPosted === false);
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

    setFilteredData(filtered);
  }, [leaseRevenueData, filters, sortConfig, properties, units]);

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
  const handleFilterChange = (key: keyof LeaseRevenueFilter, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      selectedPropertyId: "",
      selectedUnitId: "",
      selectedCustomerId: "",
      selectedContractStatus: "",
      postingStatus: "all",
      periodFrom: startOfMonth(new Date()),
      periodTo: endOfMonth(new Date()),
      includePMUnits: false,
    });
    setSearchParams(new URLSearchParams());
  };

  // Handle sorting
  const handleSort = (key: keyof LeaseRevenueData) => {
    setSortConfig((prevSort) => ({
      key,
      direction: prevSort.key === key && prevSort.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle tab change
  const handleTabChange = (tab: "unposted" | "posted") => {
    setActiveTab(tab);
    if (tab === "posted" && postedEntries.length === 0) {
      fetchPostedEntries();
    }
  };

  // Navigation handlers
  const handleCreatePosting = () => {
    navigate("/lease-revenue/posting");
  };

  const handleViewDetails = (item: LeaseRevenueData | PostedLeaseRevenueEntry) => {
    if ("PostingID" in item) {
      navigate(`/lease-revenue/posted/${item.PostingID}`);
    } else {
      navigate(`/lease-revenue/details/${item.ContractUnitID}`);
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentData = activeTab === "unposted" ? filteredData : postedEntries;
      const ids = currentData.map((item) => ("PostingID" in item ? item.PostingID : item.ContractUnitID));
      setSelectedItems(new Set(ids));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedItems(newSelection);
  };

  // Bulk operations
  const handleBulkPosting = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select items to post");
      return;
    }

    const selectedUnpostedItems = filteredData.filter((item) => selectedItems.has(item.ContractUnitID) && !item.IsPosted);

    if (selectedUnpostedItems.length === 0) {
      toast.error("No unposted items selected");
      return;
    }

    // Navigate to posting form with selected items
    const selectedIds = selectedUnpostedItems.map((item) => item.ContractUnitID);
    navigate(`/lease-revenue/posting?selected=${selectedIds.join(",")}`);
  };

  // Reversal operations
  const handleReversePosting = (voucherNo: string) => {
    setSelectedVoucherForReversal(voucherNo);
    setIsReverseDialogOpen(true);
  };

  const executeReversePosting = async () => {
    if (!selectedVoucherForReversal || !selectedCompany?.CompanyID) return;

    try {
      const reversalRequest = {
        VoucherNo: selectedVoucherForReversal,
        PostingDate: new Date(),
        CompanyID: selectedCompany.CompanyID,
      };

      const response = await leaseRevenueService.reversePosting(reversalRequest);

      if (response.Status === 1) {
        toast.success("Posting reversed successfully");
        await fetchPostedEntries();
        await fetchLeaseRevenueData();
      } else {
        toast.error(response.Message || "Failed to reverse posting");
      }
    } catch (error) {
      console.error("Error reversing posting:", error);
      toast.error("Failed to reverse posting");
    } finally {
      setIsReverseDialogOpen(false);
      setSelectedVoucherForReversal("");
    }
  };

  // PDF generation handlers
  const handleGenerateReport = async () => {
    const parameters = {
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterUnitID: filters.selectedUnitId ? parseInt(filters.selectedUnitId) : null,
      PeriodFrom: filters.periodFrom,
      PeriodTo: filters.periodTo,
      IncludePMUnits: filters.includePMUnits,
      ShowUnpostedOnly: filters.postingStatus === "unposted",
      CompanyID: selectedCompany?.CompanyID,
    };

    const response = await leaseRevenuePdf.generateReport("lease-revenue-list", parameters, {
      orientation: "Landscape",
      download: true,
      showToast: true,
      filename: `Lease_Revenue_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`,
    });

    if (response.success) {
      toast.success("Report generated successfully");
    }
  };

  const handlePreviewReport = async () => {
    const parameters = {
      FilterPropertyID: filters.selectedPropertyId ? parseInt(filters.selectedPropertyId) : null,
      FilterUnitID: filters.selectedUnitId ? parseInt(filters.selectedUnitId) : null,
      PeriodFrom: filters.periodFrom,
      PeriodTo: filters.periodTo,
      IncludePMUnits: filters.includePMUnits,
      ShowUnpostedOnly: filters.postingStatus === "unposted",
      CompanyID: selectedCompany?.CompanyID,
    };

    setShowPdfPreview(true);
    const response = await leaseRevenuePdf.generateReport("lease-revenue-list", parameters, {
      orientation: "Landscape",
      download: false,
      showToast: false,
    });

    if (!response.success) {
      toast.error("Failed to generate report preview");
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      Active: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      Completed: { variant: "default" as const, icon: CheckCircle, className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      Expired: { variant: "destructive" as const, icon: AlertCircle, className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
      Cancelled: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      Terminated: { variant: "destructive" as const, icon: XCircle, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Render posting status badge
  const renderPostingStatusBadge = (isPosted: boolean) => {
    return isPosted ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle className="w-3 h-3 mr-1" />
        Posted
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Unposted
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
  const stats: LeaseRevenueListStats = useMemo(() => {
    const data = filteredData;
    return {
      totalUnits: data.length,
      totalRevenue: data.reduce((sum, item) => sum + item.PostingAmount, 0),
      postedRevenue: data.filter((item) => item.IsPosted).reduce((sum, item) => sum + item.PostingAmount, 0),
      unpostedRevenue: data.filter((item) => !item.IsPosted).reduce((sum, item) => sum + item.PostingAmount, 0),
      averageRentPerDay: data.length > 0 ? data.reduce((sum, item) => sum + item.RentPerDay, 0) / data.length : 0,
      totalContracts: new Set(data.map((item) => item.LeaseNo)).size,
      postedCount: data.filter((item) => item.IsPosted).length,
      unpostedCount: data.filter((item) => !item.IsPosted).length,
    };
  }, [filteredData]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchTerm ||
    filters.selectedPropertyId ||
    filters.selectedUnitId ||
    filters.selectedCustomerId ||
    filters.selectedContractStatus ||
    filters.postingStatus !== "all" ||
    filters.includePMUnits;

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
            <h1 className="text-2xl font-semibold">Lease Revenue Management</h1>
            <p className="text-muted-foreground">
              Process lease revenue postings and manage posted entries for period{" "}
              {filters.periodFrom && filters.periodTo && `${formatDate(filters.periodFrom)} to ${formatDate(filters.periodTo)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button onClick={handleCreatePosting}>
              <Receipt className="mr-2 h-4 w-4" />
              Create Posting
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Units</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalUnits}</div>
              <div className="text-xs text-muted-foreground">{stats.totalContracts} contracts</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-muted-foreground">Total Revenue</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-muted-foreground">Posted</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.postedRevenue)}</div>
              <div className="text-xs text-muted-foreground">{stats.postedCount} units</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-muted-foreground">Unposted</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(stats.unpostedRevenue)}</div>
              <div className="text-xs text-muted-foreground">{stats.unpostedCount} units</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-muted-foreground">Avg Rent/Day</span>
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(stats.averageRentPerDay)}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm text-muted-foreground">Posting Rate</span>
              </div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalUnits > 0 ? Math.round((stats.postedCount / stats.totalUnits) * 100) : 0}%</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow dark:hover:shadow-lg dark:hover:shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Period Days</span>
              </div>
              <div className="text-2xl font-bold">
                {filters.periodFrom && filters.periodTo ? Math.ceil((filters.periodTo.getTime() - filters.periodFrom.getTime()) / (1000 * 60 * 60 * 24)) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lease Revenue {activeTab === "unposted" ? "Data" : "Posted Entries"}</CardTitle>
                <CardDescription>
                  {activeTab === "unposted"
                    ? `${hasActiveFilters ? `Showing ${filteredData.length} of ${leaseRevenueData.length}` : `Showing all ${leaseRevenueData.length}`} lease revenue entries`
                    : `${postedEntries.length} posted entries for the selected period`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Tab Switcher */}
                <div className="flex bg-muted p-1 rounded-lg">
                  <Button variant={activeTab === "unposted" ? "default" : "ghost"} size="sm" onClick={() => handleTabChange("unposted")}>
                    Unposted Data ({stats.unpostedCount})
                  </Button>
                  <Button variant={activeTab === "posted" ? "default" : "ghost"} size="sm" onClick={() => handleTabChange("posted")}>
                    Posted Entries ({postedEntries.length})
                  </Button>
                </div>

                {/* PDF Generation */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={leaseRevenuePdf.isLoading}>
                      {leaseRevenuePdf.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Export
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePreviewReport}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGenerateReport}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bulk Operations */}
                {selectedItems.size > 0 && activeTab === "unposted" && (
                  <Button onClick={handleBulkPosting}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Post Selected ({selectedItems.size})
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
                <Input type="text" placeholder="Search lease revenue..." className="pl-9" defaultValue={filters.searchTerm} onChange={handleSearchChange} />
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg dark:bg-muted/20">
                  <Select value={filters.selectedPropertyId || "all"} onValueChange={(value) => handleFilterChange("selectedPropertyId", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by property" />
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

                  <Select value={filters.selectedUnitId || "all"} onValueChange={(value) => handleFilterChange("selectedUnitId", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Units</SelectItem>
                      {units
                        .filter((unit) => !filters.selectedPropertyId || unit.PropertyID.toString() === filters.selectedPropertyId)
                        .map((unit) => (
                          <SelectItem key={unit.UnitID} value={unit.UnitID.toString()}>
                            {unit.UnitNo} - {unit.PropertyName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.selectedContractStatus || "all"} onValueChange={(value) => handleFilterChange("selectedContractStatus", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Contract Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {contractStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.postingStatus} onValueChange={(value) => handleFilterChange("postingStatus", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Posting Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {postingStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <DatePicker value={filters.periodFrom} onChange={(date) => handleFilterChange("periodFrom", date)} placeholder="Period From" />

                  <DatePicker value={filters.periodTo} onChange={(date) => handleFilterChange("periodTo", date)} placeholder="Period To" />

                  <div className="flex items-center space-x-2">
                    <Checkbox id="includePMUnits" checked={filters.includePMUnits} onCheckedChange={(checked) => handleFilterChange("includePMUnits", checked)} />
                    <label htmlFor="includePMUnits" className="text-sm">
                      Include PM Units
                    </label>
                  </div>

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
                  {filters.selectedPropertyId && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("selectedPropertyId", "")}>
                      Property: {properties.find((p) => p.PropertyID.toString() === filters.selectedPropertyId)?.PropertyName}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.postingStatus !== "all" && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("postingStatus", "all")}>
                      Status: {postingStatusOptions.find((o) => o.value === filters.postingStatus)?.label}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  {filters.includePMUnits && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleFilterChange("includePMUnits", false)}>
                      Include PM Units <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Data Table */}
            {activeTab === "unposted" ? (
              // Unposted Data Table
              filteredData.length === 0 ? (
                <div className="text-center py-10">
                  {hasActiveFilters ? (
                    <div>
                      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-4">No lease revenue data found matching your criteria.</p>
                      <Button variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-4">No lease revenue data found for the selected period.</p>
                      <p className="text-sm text-muted-foreground mb-4">Try adjusting your period dates or check if there are active contracts for this period.</p>
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
                            checked={selectedItems.size === filteredData.length && filteredData.length > 0}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all items"
                          />
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("LeaseNo")}>
                          <div className="flex items-center gap-1">
                            Lease No
                            {sortConfig.key === "LeaseNo" ? (
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
                        <TableHead className="cursor-pointer" onClick={() => handleSort("Property")}>
                          <div className="flex items-center gap-1">
                            Property & Unit
                            {sortConfig.key === "Property" ? (
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
                        <TableHead className="cursor-pointer" onClick={() => handleSort("CustomerName")}>
                          <div className="flex items-center gap-1">
                            Customer
                            {sortConfig.key === "CustomerName" ? (
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
                        <TableHead>Period</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("TotalLeaseDays")}>
                          <div className="flex items-center gap-1">
                            Days
                            {sortConfig.key === "TotalLeaseDays" ? (
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
                        <TableHead className="cursor-pointer" onClick={() => handleSort("RentPerDay")}>
                          <div className="flex items-center gap-1">
                            Rent/Day
                            {sortConfig.key === "RentPerDay" ? (
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
                        <TableHead className="cursor-pointer" onClick={() => handleSort("PostingAmount")}>
                          <div className="flex items-center gap-1">
                            Posting Amount
                            {sortConfig.key === "PostingAmount" ? (
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
                        <TableHead>Status</TableHead>
                        <TableHead>Posted</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => (
                        <TableRow
                          key={item.ContractUnitID}
                          className={cn(
                            "hover:bg-muted/50 transition-colors",
                            selectedItems.has(item.ContractUnitID) && "bg-accent/50 dark:bg-accent/20",
                            item.IsPosted && "bg-green-50/30 dark:bg-green-950/20"
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.has(item.ContractUnitID)}
                              onCheckedChange={(checked) => handleSelectItem(item.ContractUnitID, checked as boolean)}
                              aria-label={`Select ${item.LeaseNo}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.LeaseNo}</div>
                            <div className="text-sm text-muted-foreground">Unit ID: {item.ContractUnitID}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.Property}</div>
                            <div className="text-sm text-muted-foreground">{item.UnitNo}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.CustomerName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>
                                <strong>From:</strong> {formatDate(item.StartDate)}
                              </div>
                              <div>
                                <strong>To:</strong> {formatDate(item.EndDate)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium">{item.TotalLeaseDays}</div>
                              <div className="text-xs text-muted-foreground">days</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(item.RentPerDay)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold">{formatCurrency(item.PostingAmount)}</div>
                            {item.Balance !== item.PostingAmount && <div className="text-sm text-muted-foreground">Balance: {formatCurrency(item.Balance)}</div>}
                          </TableCell>
                          <TableCell>{renderStatusBadge(item.ContractStatus)}</TableCell>
                          <TableCell>{renderPostingStatusBadge(item.IsPosted)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {!item.IsPosted && (
                                  <DropdownMenuItem onClick={() => navigate(`/lease-revenue/posting?selected=${item.ContractUnitID}`)}>
                                    <Receipt className="mr-2 h-4 w-4" />
                                    Create Posting
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate(`/contracts/${item.LeaseNo}`)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Contract
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : // Posted Entries Table
            postedEntries.length === 0 ? (
              <div className="text-center py-10">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No posted entries found for the selected period.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voucher No</TableHead>
                      <TableHead>Posting Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Transaction Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Posted By</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postedEntries.map((entry) => (
                      <TableRow key={entry.PostingID} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium">{entry.VoucherNo}</div>
                          <div className="text-sm text-muted-foreground">ID: {entry.PostingID}</div>
                        </TableCell>
                        <TableCell>{formatDate(entry.PostingDate)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{entry.AccountName}</div>
                          <div className="text-sm text-muted-foreground">{entry.AccountCode}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.TransactionType === "Debit" ? "default" : "outline"}>{entry.TransactionType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{entry.TransactionType === "Debit" ? formatCurrency(entry.DebitAmount) : formatCurrency(entry.CreditAmount)}</div>
                        </TableCell>
                        <TableCell>
                          {entry.UnitNo && (
                            <div>
                              <div className="font-medium">{entry.UnitNo}</div>
                              <div className="text-sm text-muted-foreground">{entry.PropertyName}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{entry.CustomerFullName && <div className="font-medium">{entry.CustomerFullName}</div>}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {entry.CreatedBy && <div>{entry.CreatedBy}</div>}
                            {entry.CreatedOn && <div className="text-muted-foreground">{formatDate(entry.CreatedOn)}</div>}
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
                              <DropdownMenuItem onClick={() => handleViewDetails(entry)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => handleReversePosting(entry.VoucherNo)}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reverse Posting
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

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          pdfBlob={leaseRevenuePdf.data}
          title="Lease Revenue Report"
          isLoading={leaseRevenuePdf.isLoading}
          error={leaseRevenuePdf.error}
          onDownload={() => leaseRevenuePdf.downloadCurrentPdf("Lease_Revenue_Report.pdf")}
          onRefresh={handlePreviewReport}
        />

        {/* Reverse Posting Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isReverseDialogOpen}
          onClose={() => setIsReverseDialogOpen(false)}
          onConfirm={executeReversePosting}
          title="Reverse Posting"
          description={`Are you sure you want to reverse voucher "${selectedVoucherForReversal}"? This will create reversal entries and cannot be undone.`}
          cancelText="Cancel"
          confirmText="Reverse"
          type="danger"
        />
      </div>
    </TooltipProvider>
  );
};

export default LeaseRevenueList;
