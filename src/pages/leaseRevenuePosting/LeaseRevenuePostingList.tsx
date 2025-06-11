// src/pages/leaseRevenuePosting/LeaseRevenuePostingList.tsx
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
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  Send,
  RotateCcw,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Form } from "@/components/ui/form";
import { leaseRevenuePostingService } from "@/services/leaseRevenuePostingService";
import { accountService } from "@/services/accountService";
import { companyService } from "@/services/companyService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { FormField } from "@/components/forms/FormField";
import {
  LeaseRevenueTransaction,
  PostedLeaseRevenueTransaction,
  SelectedTransaction,
  LeaseRevenueFilters,
  PostingRequest,
  ReversalRequest,
} from "@/types/leaseRevenuePostingTypes";
import { Account } from "@/types/accountTypes";
import { Company } from "@/services/companyService";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Currency, currencyService } from "@/services/currencyService";
import { debounce } from "lodash";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { propertyService } from "@/services/propertyService";
import { customerService } from "@/services/customerService";

const postingSchema = z.object({
  postingDate: z.date({ required_error: "Posting date is required" }),
  debitAccountId: z.string().min(1, "Debit account is required"),
  creditAccountId: z.string().min(1, "Credit account is required"),
  narration: z.string().optional(),
  referenceNo: z.string().optional(),
  exchangeRate: z.coerce.number().min(0.0001, "Exchange rate must be greater than 0").optional(),
});

type PostingFormValues = z.infer<typeof postingSchema>;

const LeaseRevenuePostingList = () => {
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [unpostedTransactions, setUnpostedTransactions] = useState<LeaseRevenueTransaction[]>([]);
  const [postedTransactions, setPostedTransactions] = useState<PostedLeaseRevenueTransaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("unposted");

  // Selection state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectedPosting, setSelectedPosting] = useState<PostedLeaseRevenueTransaction | null>(null);

  // Dialog states
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState("");

  // Filter states
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

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
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    fetchReferenceData();
  }, []);

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
  const fetchData = async (filters?: LeaseRevenueFilters) => {
    try {
      setLoading(true);

      const [unpostedData, postedData] = await Promise.all([
        leaseRevenuePostingService.getUnpostedTransactions(filters || {}),
        leaseRevenuePostingService.getPostedTransactions(filters || {}),
      ]);

      setUnpostedTransactions(unpostedData);
      setPostedTransactions(postedData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
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
    const filters: LeaseRevenueFilters = {
      CompanyID: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
      FiscalYearID: selectedFiscalYearId ? parseInt(selectedFiscalYearId) : undefined,
      PropertyID: selectedPropertyId ? parseInt(selectedPropertyId) : undefined,
      CustomerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
      PeriodFromDate: dateFrom,
      PeriodToDate: dateTo,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof LeaseRevenueFilters] === undefined) {
        delete filters[key as keyof LeaseRevenueFilters];
      }
    });

    fetchData(filters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCompanyId("");
    setSelectedFiscalYearId("");
    setSelectedPropertyId("");
    setSelectedCustomerId("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedTransactions(new Set());
    fetchData();
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

        return {
          TransactionType: type as "Invoice" | "Receipt",
          TransactionID: parseInt(id),
          PostingAmount: transaction?.PostingAmount || 0,
          DebitAccountID: parseInt(data.debitAccountId),
          CreditAccountID: parseInt(data.creditAccountId),
          Narration: data.narration || transaction?.BalanceNarration || "",
        };
      });

      const postingRequest: PostingRequest = {
        PostingDate: data.postingDate,
        DebitAccountID: parseInt(data.debitAccountId),
        CreditAccountID: parseInt(data.creditAccountId),
        Narration: data.narration,
        ReferenceNo: data.referenceNo,
        ExchangeRate: data.exchangeRate,
        CompanyID: selectedCompanyId ? parseInt(selectedCompanyId) : 1, // Default company
        FiscalYearID: selectedFiscalYearId ? parseInt(selectedFiscalYearId) : 1, // Default fiscal year
        SelectedTransactions: selectedTxns,
      };

      const result = await leaseRevenuePostingService.postSelectedTransactions(postingRequest);

      if (result.success) {
        toast.success(`Posted ${result.PostedCount} transactions successfully`);
        if (result.FailedCount && result.FailedCount > 0) {
          toast.warning(`${result.FailedCount} transactions failed to post`);
        }

        // Reset selection and refresh data
        setSelectedTransactions(new Set());
        setPostingDialogOpen(false);
        postingForm.reset();
        fetchData();
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
        fetchData();
      }
    } catch (error) {
      console.error("Error reversing transaction:", error);
      toast.error("Failed to reverse transaction");
    } finally {
      setActionLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Render status badge
  const renderStatusBadge = (isPosted: boolean, isReversed?: boolean) => {
    if (isReversed) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          <XCircle className="w-3 h-3 mr-1" />
          Reversed
        </Badge>
      );
    }

    if (isPosted) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Posted
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Unposted
      </Badge>
    );
  };

  // Calculate statistics
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
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Lease Revenue Posting</h1>
          <p className="text-muted-foreground">Post lease revenue transactions to the general ledger</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPostingDialogOpen(true)} disabled={selectedTransactions.size === 0}>
            <Send className="mr-2 h-4 w-4" />
            Post Selected ({selectedTransactions.size})
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lease Revenue Transactions</CardTitle>
          <CardDescription>Manage lease revenue posting operations</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search transactions..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <Select
                value={selectedCompanyId || "all"}
                onValueChange={(value) => {
                  setSelectedCompanyId(value === "all" ? "" : value);
                  setTimeout(handleFilterChange, 100);
                }}
              >
                <SelectTrigger className="w-[180px] flex-shrink-0">
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

              <Select
                value={selectedFiscalYearId || "all"}
                onValueChange={(value) => {
                  setSelectedFiscalYearId(value === "all" ? "" : value);
                  setTimeout(handleFilterChange, 100);
                }}
              >
                <SelectTrigger className="w-[160px] flex-shrink-0">
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
                value={selectedCustomerId || "all"}
                onValueChange={(value) => {
                  setSelectedCustomerId(value === "all" ? "" : value);
                  setTimeout(handleFilterChange, 100);
                }}
              >
                <SelectTrigger className="w-[180px] flex-shrink-0">
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

          {/* Tabs for Unposted and Posted */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unposted">Unposted Transactions ({unpostedStats.total})</TabsTrigger>
              <TabsTrigger value="posted">Posted Transactions ({postedStats.total})</TabsTrigger>
            </TabsList>

            {/* Unposted Transactions Tab */}
            <TabsContent value="unposted">
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Total Transactions</span>
                    </div>
                    <div className="text-2xl font-bold">{unpostedStats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">{formatCurrency(unpostedStats.totalAmount)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Selected</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{unpostedStats.selected}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Selected Amount</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">{formatCurrency(unpostedStats.selectedAmount)}</div>
                  </CardContent>
                </Card>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : unpostedTransactions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No unposted transactions found.</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox checked={selectedTransactions.size === unpostedTransactions.length && unpostedTransactions.length > 0} onCheckedChange={handleSelectAll} />
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
                        return (
                          <TableRow key={transactionKey}>
                            <TableCell>
                              <Checkbox
                                checked={selectedTransactions.has(transactionKey)}
                                onCheckedChange={(checked) => handleSelectTransaction(transactionKey, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{transaction.TransactionNo}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {transaction.TransactionType}
                                </Badge>
                                <Calendar className="h-3 w-3" />
                                {format(new Date(transaction.TransactionDate), "MMM dd, yyyy")}
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
                                {format(new Date(transaction.StartDate), "MMM dd")} - {format(new Date(transaction.EndDate), "MMM dd, yyyy")}
                              </div>
                              <div className="text-xs text-muted-foreground">{transaction.TotalLeaseDays} days</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(transaction.PostingAmount)}</div>
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
                                  <DropdownMenuItem onClick={() => navigate(`/lease-revenue-posting/details/${transaction.TransactionType}/${transaction.TransactionID}`)}>
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
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Posted Transactions</span>
                    </div>
                    <div className="text-2xl font-bold">{postedStats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Total Posted Amount</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">{formatCurrency(postedStats.totalAmount)}</div>
                  </CardContent>
                </Card>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : postedTransactions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No posted transactions found.</div>
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
                      {postedTransactions.map((posting) => (
                        <TableRow key={posting.PostingID}>
                          <TableCell>
                            <div className="font-medium">{posting.VoucherNo}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(posting.PostingDate), "MMM dd, yyyy")}
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
                          <TableCell>{renderStatusBadge(true, posting.IsReversed)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/lease-revenue-posting/posting-details/${posting.PostingID}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                {!posting.IsReversed && (
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
              <Textarea id="reversal-reason" placeholder="Enter reason for reversal" value={reversalReason} onChange={(e) => setReversalReason(e.target.value)} rows={3} required />
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
    </div>
  );
};

export default LeaseRevenuePostingList;
