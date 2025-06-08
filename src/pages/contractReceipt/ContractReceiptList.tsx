// src/pages/contractReceipt/ContractReceiptList.tsx
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
  ArrowUpDown,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { FormField } from "@/components/forms/FormField";
import { Form } from "@/components/ui/form";
import { leaseReceiptService } from "@/services/contractReceiptService";
import { customerService } from "@/services/customerService";
import { propertyService } from "@/services/propertyService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { accountService } from "@/services/accountService";
import { currencyService } from "@/services/currencyService";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ContractReceipt,
  ReceiptSearchParams,
  ReceiptStatistics,
  ReceiptPostingRequest,
  BulkReceiptPostingRequest,
  SelectedReceiptForPosting,
  BulkOperationRequest,
  BulkReceiptOperation,
  PAYMENT_TYPE,
  PAYMENT_STATUS,
  BULK_OPERATION_TYPE,
} from "@/types/contractReceiptTypes";
import { bankService } from "@/services/bankService";

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

const ContractReceiptList: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [receipts, setReceipts] = useState<ContractReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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

  // Selected items for actions
  const [selectedReceipt, setSelectedReceipt] = useState<ContractReceipt | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  // Filter states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [depositDateFrom, setDepositDateFrom] = useState<Date | undefined>();
  const [depositDateTo, setDepositDateTo] = useState<Date | undefined>();
  const [showPostedOnly, setShowPostedOnly] = useState<boolean | undefined>();
  const [showAdvanceOnly, setShowAdvanceOnly] = useState<boolean | undefined>();

  // Statistics
  const [statistics, setStatistics] = useState<ReceiptStatistics>({
    statusCounts: [],
    paymentTypeCounts: [],
    monthlyTrends: [],
    pendingDeposits: { PendingDepositCount: 0, PendingDepositAmount: 0, AvgDaysWaiting: 0 },
  });

  // Active tab
  const [activeTab, setActiveTab] = useState("all");

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

  // Fetch data on component mount
  useEffect(() => {
    fetchReceipts();
    fetchReferenceData();
    fetchStatistics();
  }, []);

  // Fetch reference data
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

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const stats = await leaseReceiptService.getReceiptStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Fetch receipts with filters
  const fetchReceipts = async (filters?: ReceiptSearchParams) => {
    try {
      setLoading(true);
      const receiptsData = await leaseReceiptService.searchReceipts(filters || {});
      setReceipts(receiptsData);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Failed to load receipts");
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
    const filters: ReceiptSearchParams = {
      searchText: searchTerm || undefined,
      FilterCustomerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      FilterPropertyID: selectedPropertyId ? parseInt(selectedPropertyId) : undefined,
      FilterPaymentStatus: selectedPaymentStatus || undefined,
      FilterPaymentType: selectedPaymentType || undefined,
      FilterBankID: selectedBankId ? parseInt(selectedBankId) : undefined,
      FilterFromDate: dateFrom,
      FilterToDate: dateTo,
      FilterDepositFromDate: depositDateFrom,
      FilterDepositToDate: depositDateTo,
      FilterPostedOnly: showPostedOnly,
      FilterAdvanceOnly: showAdvanceOnly,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof ReceiptSearchParams] === undefined) {
        delete filters[key as keyof ReceiptSearchParams];
      }
    });

    fetchReceipts(filters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCustomerId("");
    setSelectedPropertyId("");
    setSelectedPaymentStatus("");
    setSelectedPaymentType("");
    setSelectedBankId("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setDepositDateFrom(undefined);
    setDepositDateTo(undefined);
    setShowPostedOnly(undefined);
    setShowAdvanceOnly(undefined);
    setSelectedReceipts(new Set());
    fetchReceipts();
  };

  // Navigation handlers
  const handleCreateReceipt = () => {
    navigate("/receipts/new");
  };

  const handleViewReceipt = (receipt: ContractReceipt) => {
    navigate(`/receipts/${receipt.LeaseReceiptID}`);
  };

  const handleEditReceipt = (receipt: ContractReceipt) => {
    navigate(`/receipts/edit/${receipt.LeaseReceiptID}`);
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
      const filteredIds = getFilteredReceipts().map((receipt) => receipt.LeaseReceiptID);
      setSelectedReceipts(new Set(filteredIds));
    } else {
      setSelectedReceipts(new Set());
    }
  };

  // Get filtered receipts based on active tab
  const getFilteredReceipts = () => {
    switch (activeTab) {
      case "unposted":
        return receipts.filter((receipt) => !receipt.IsPosted);
      case "posted":
        return receipts.filter((receipt) => receipt.IsPosted);
      case "pending-deposits":
        return receipts.filter((receipt) => receipt.RequiresDeposit && !receipt.DepositDate);
      case "advance":
        return receipts.filter((receipt) => receipt.IsAdvancePayment);
      case "bounced":
        return receipts.filter((receipt) => receipt.PaymentStatus === PAYMENT_STATUS.BOUNCED);
      default:
        return receipts;
    }
  };

  // Status change handlers
  const openStatusChangeDialog = (receipt: ContractReceipt, status: string) => {
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
        // Update receipt in the list
        setReceipts(
          receipts.map((receipt) => (receipt.LeaseReceiptID === selectedReceipt.LeaseReceiptID ? { ...receipt, PaymentStatus: newStatus, ClearanceDate: clearanceDate } : receipt))
        );
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
    setSelectedReceipt(receipt);
    setDeleteDialogOpen(true);
  };

  const handleDeleteReceipt = async () => {
    if (!selectedReceipt) return;

    try {
      setActionLoading(true);
      const response = await leaseReceiptService.deleteReceipt(selectedReceipt.LeaseReceiptID);

      if (response.Status === 1) {
        setReceipts(receipts.filter((receipt) => receipt.LeaseReceiptID !== selectedReceipt.LeaseReceiptID));
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
        // Update receipt in the list
        setReceipts(receipts.map((receipt) => (receipt.LeaseReceiptID === selectedReceipt.LeaseReceiptID ? { ...receipt, IsPosted: true } : receipt)));
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

    try {
      setActionLoading(true);
      const selectedReceiptsList = Array.from(selectedReceipts)
        .map((id) => receipts.find((receipt) => receipt.LeaseReceiptID === id))
        .filter(Boolean) as ContractReceipt[];

      const selectedForPosting: SelectedReceiptForPosting[] = selectedReceiptsList.map((receipt) => ({
        LeaseReceiptID: receipt.LeaseReceiptID,
        PostingAmount: receipt.ReceivedAmount,
        DebitAccountID: parseInt(data.debitAccountId),
        CreditAccountID: parseInt(data.creditAccountId),
        Narration: data.narration || `Receipt - ${receipt.ReceiptNo}`,
      }));

      // Since we don't have a bulk posting endpoint in the service, post them individually
      let postedCount = 0;
      let failedCount = 0;

      for (const receipt of selectedReceiptsList) {
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

      // Update posted receipts in the list
      setReceipts(receipts.map((receipt) => (selectedReceipts.has(receipt.LeaseReceiptID) ? { ...receipt, IsPosted: true } : receipt)));

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
        // Update receipts in the list
        setReceipts(
          receipts.map((receipt) =>
            selectedReceipts.has(receipt.LeaseReceiptID) ? { ...receipt, DepositDate: data.depositDate, DepositedBankID: parseInt(data.depositBankId) } : receipt
          )
        );
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
  const filteredReceipts = getFilteredReceipts();
  const stats = {
    total: receipts.length,
    unposted: receipts.filter((receipt) => !receipt.IsPosted).length,
    posted: receipts.filter((receipt) => receipt.IsPosted).length,
    pendingDeposits: receipts.filter((receipt) => receipt.RequiresDeposit && !receipt.DepositDate).length,
    advance: receipts.filter((receipt) => receipt.IsAdvancePayment).length,
    bounced: receipts.filter((receipt) => receipt.PaymentStatus === PAYMENT_STATUS.BOUNCED).length,
    totalAmount: receipts.reduce((sum, receipt) => sum + receipt.ReceivedAmount, 0),
    selectedCount: selectedReceipts.size,
    selectedAmount: Array.from(selectedReceipts).reduce((sum, id) => {
      const receipt = receipts.find((r) => r.LeaseReceiptID === id);
      return sum + (receipt?.ReceivedAmount || 0);
    }, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Contract Receipt Management</h1>
          <p className="text-muted-foreground">Manage lease receipts and payment posting</p>
        </div>
        <div className="flex gap-2">
          {selectedReceipts.size > 0 && (
            <>
              <Button onClick={() => setBulkPostingDialogOpen(true)} disabled={selectedReceipts.size === 0}>
                <Send className="mr-2 h-4 w-4" />
                Post Selected ({selectedReceipts.size})
              </Button>
              <Button variant="outline" onClick={() => setBulkDepositDialogOpen(true)} disabled={selectedReceipts.size === 0}>
                <Banknote className="mr-2 h-4 w-4" />
                Mark Deposited ({selectedReceipts.size})
              </Button>
            </>
          )}
          <Button onClick={handleCreateReceipt}>
            <Plus className="mr-2 h-4 w-4" />
            New Receipt
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Contract Receipts</CardTitle>
          <CardDescription>View and manage payment receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Unposted</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.unposted}</div>
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
                  <Banknote className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">Pending Deposits</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{stats.pendingDeposits}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Advance</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{stats.advance}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Bounced</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.bounced}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                </div>
                <div className="text-lg font-bold text-indigo-600">{formatCurrency(stats.totalAmount)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search receipts..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
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
                value={selectedPaymentStatus || "all"}
                onValueChange={(value) => {
                  setSelectedPaymentStatus(value === "all" ? "" : value);
                  setTimeout(handleFilterChange, 100);
                }}
              >
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

              <Select
                value={selectedPaymentType || "all"}
                onValueChange={(value) => {
                  setSelectedPaymentType(value === "all" ? "" : value);
                  setTimeout(handleFilterChange, 100);
                }}
              >
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="unposted">Unposted ({stats.unposted})</TabsTrigger>
              <TabsTrigger value="posted">Posted ({stats.posted})</TabsTrigger>
              <TabsTrigger value="pending-deposits">Pending Deposits ({stats.pendingDeposits})</TabsTrigger>
              <TabsTrigger value="advance">Advance ({stats.advance})</TabsTrigger>
              <TabsTrigger value="bounced">Bounced ({stats.bounced})</TabsTrigger>
            </TabsList>

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
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredReceipts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchTerm || selectedCustomerId || selectedPaymentStatus || dateFrom || dateTo ? "No receipts found matching your criteria." : "No receipts found."}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox checked={selectedReceipts.size === filteredReceipts.length && filteredReceipts.length > 0} onCheckedChange={handleSelectAll} />
                        </TableHead>
                        <TableHead className="w-[160px]">Receipt #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Payment Details</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceipts.map((receipt) => (
                        <TableRow key={receipt.LeaseReceiptID}>
                          <TableCell>
                            <Checkbox
                              checked={selectedReceipts.has(receipt.LeaseReceiptID)}
                              onCheckedChange={(checked) => handleSelectReceipt(receipt.LeaseReceiptID, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
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
                            {receipt.SecurityDepositAmount > 0 && <div className="text-sm text-muted-foreground">Security: {formatCurrency(receipt.SecurityDepositAmount)}</div>}
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
                                {!receipt.IsPosted && (
                                  <DropdownMenuItem onClick={() => handleEditReceipt(receipt)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {!receipt.IsPosted && (
                                  <DropdownMenuItem onClick={() => openPostingDialog(receipt)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Post
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="font-medium text-muted-foreground">Change Status</DropdownMenuLabel>

                                {paymentStatusOptions
                                  .filter((status) => status !== receipt.PaymentStatus)
                                  .map((status) => (
                                    <DropdownMenuItem key={status} onClick={() => openStatusChangeDialog(receipt, status)}>
                                      Set as {status}
                                    </DropdownMenuItem>
                                  ))}

                                <DropdownMenuSeparator />

                                {!receipt.IsPosted && receipt.PaymentStatus !== PAYMENT_STATUS.BOUNCED && (
                                  <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(receipt)}>
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
    </div>
  );
};

export default ContractReceiptList;
