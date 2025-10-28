// src/pages/generalLedger/GLTransactions.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Download, Filter, Calendar, Building, RefreshCw, Search, FileText, MoreHorizontal, Info, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { generalLedgerService } from "@/services/generalLedgerService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { companyService } from "@/services/companyService";
import { accountService } from "@/services/accountService";
import { DetailedGLTransaction } from "@/types/generalLedgerTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";
import { Account } from "@/types/accountTypes";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { debounce } from "lodash";
import { GLTransactionSlipPreview } from "@/pages/generalLedger/GLTransactionSlipPreview";

const GLTransactions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [transactions, setTransactions] = useState<DetailedGLTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<DetailedGLTransaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTaxColumns, setShowTaxColumns] = useState(false);
  const [previewTransaction, setPreviewTransaction] = useState<DetailedGLTransaction | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedVoucherType, setSelectedVoucherType] = useState<string>("");
  const [selectedPostingStatus, setSelectedPostingStatus] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [showReversedTransactions, setShowReversedTransactions] = useState<string>("false");

  // Initialize component
  useEffect(() => {
    initializeComponent();
  }, []);

  // Debounced search function
  const debouncedSearch = debounce(() => {
    if (transactions.length > 0) {
      const filtered = transactions.filter(
        (transaction) =>
          transaction.VoucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.AccountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.AccountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.Narration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.CustomerFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.SupplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.TaxCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.TaxName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTransactions(filtered);
    }
  }, 300);

  // Handle search input change
  useEffect(() => {
    debouncedSearch();
  }, [searchTerm, transactions]);

  // Check if any transactions have tax information
  useEffect(() => {
    if (transactions.length > 0) {
      const hasTaxData = transactions.some((transaction) => transaction.TaxID || transaction.TaxCode || transaction.BaseAmount || transaction.LineTaxAmount);
      setShowTaxColumns(hasTaxData);
    }
  }, [transactions]);

  const initializeComponent = async () => {
    try {
      setInitialLoading(true);

      // Fetch reference data
      const [companiesData, fiscalYearsData] = await Promise.all([companyService.getCompaniesForDropdown(true), fiscalYearService.getAllFiscalYears()]);

      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);

      // Set initial values from URL params or defaults
      const companyId = searchParams.get("companyId") || (companiesData.length > 0 ? companiesData[0].CompanyID.toString() : "");
      const fiscalYearId = searchParams.get("fiscalYearId") || "";

      setSelectedCompanyId(companyId);
      setSelectedFiscalYearId(fiscalYearId);

      // Fetch accounts for the selected company
      if (companyId) {
        await fetchAccounts(companyId);
      }

      // Set default date range to fiscal year period
      if (fiscalYearId) {
        const fiscalYear = fiscalYearsData.find((fy) => fy.FiscalYearID === parseInt(fiscalYearId));
        if (fiscalYear) {
          setFromDate(format(new Date(fiscalYear.StartDate), "yyyy-MM-dd"));
          setToDate(format(new Date(fiscalYear.EndDate), "yyyy-MM-dd"));
        }
      }

      // Load transactions if we have required data
      if (companyId && fiscalYearId) {
        await fetchTransactions(parseInt(companyId), parseInt(fiscalYearId));
      }
    } catch (error) {
      console.error("Error initializing component:", error);
      toast.error("Failed to load GL transactions data");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchAccounts = async (companyId?: string) => {
    try {
      const accountsData = await accountService.searchAccounts({
        companyID: companyId ? parseInt(companyId) : undefined,
        isActive: true,
      });
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    }
  };

  const fetchTransactions = async (companyId?: number, fiscalYearId?: number) => {
    const targetCompanyId = companyId || parseInt(selectedCompanyId);
    const targetFiscalYearId = fiscalYearId || parseInt(selectedFiscalYearId);

    if (!targetCompanyId) {
      toast.error("Please select a company");
      return;
    }

    try {
      setLoading(true);

      const response = await generalLedgerService.getDetailedGLTransactions({
        companyID: targetCompanyId,
        fiscalYearID: targetFiscalYearId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        accountID: selectedAccountId && selectedAccountId !== "0" ? parseInt(selectedAccountId) : undefined,
        voucherType: selectedVoucherType || undefined,
        postingStatus: selectedPostingStatus || undefined,
        customerID: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
        supplierID: selectedSupplierId ? parseInt(selectedSupplierId) : undefined,
        isReversed: showReversedTransactions === "true" ? true : showReversedTransactions === "false" ? false : undefined,
        searchText: undefined, // We'll handle search locally for better performance
      });

      setTransactions(response);
      setFilteredTransactions(response);

      if (response.length === 0) {
        toast.info("No transactions found for the selected criteria");
      }
    } catch (error) {
      console.error("Error fetching GL transactions:", error);
      toast.error("Failed to load GL transactions");
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewSlip = (transaction: DetailedGLTransaction) => {
    setPreviewTransaction(transaction);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewTransaction(null);
  };

  const handleCompanyChange = async (value: string) => {
    setSelectedCompanyId(value);
    setSelectedAccountId("");
    setTransactions([]);
    setFilteredTransactions([]);

    if (value) {
      await fetchAccounts(value);
    }
  };

  const handleFiscalYearChange = (value: string) => {
    setSelectedFiscalYearId(value);
    setTransactions([]);
    setFilteredTransactions([]);

    // Update default date range
    const fiscalYear = fiscalYears.find((fy) => fy.FiscalYearID === parseInt(value));
    if (fiscalYear) {
      setFromDate(format(new Date(fiscalYear.StartDate), "yyyy-MM-dd"));
      setToDate(format(new Date(fiscalYear.EndDate), "yyyy-MM-dd"));
    }
  };

  const handleRefresh = () => {
    fetchTransactions();
  };

  const handleExport = () => {
    toast.info("Export functionality will be implemented");
  };

  const handleViewAccountLedger = (accountId: number) => {
    const params = new URLSearchParams({
      companyId: selectedCompanyId,
      fiscalYearId: selectedFiscalYearId,
      accountId: accountId.toString(),
    });
    navigate(`/general-ledger/account-ledger?${params.toString()}`);
  };

  const resetFilters = () => {
    setSelectedAccountId("");
    setSelectedVoucherType("");
    setSelectedPostingStatus("");
    setSelectedCustomerId("");
    setSelectedSupplierId("");
    setShowReversedTransactions("false");
    setSearchTerm("");
    setFromDate("");
    setToDate("");

    // Reset to fiscal year dates if available
    if (selectedFiscalYearId) {
      const fiscalYear = fiscalYears.find((fy) => fy.FiscalYearID === parseInt(selectedFiscalYearId));
      if (fiscalYear) {
        setFromDate(format(new Date(fiscalYear.StartDate), "yyyy-MM-dd"));
        setToDate(format(new Date(fiscalYear.EndDate), "yyyy-MM-dd"));
      }
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount === 0) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage?: number): string => {
    if (!percentage) return "-";
    return `${percentage.toFixed(2)}%`;
  };

  const getFilteredFiscalYears = () => {
    if (!selectedCompanyId) return fiscalYears;
    return fiscalYears.filter((fy) => fy.CompanyID === parseInt(selectedCompanyId));
  };

  const getVoucherTypes = () => {
    const types = new Set(transactions.map((t) => t.VoucherType));
    return Array.from(types).filter(Boolean).sort();
  };

  const getPostingStatuses = () => {
    const statuses = new Set(transactions.map((t) => t.PostingStatus));
    return Array.from(statuses).filter(Boolean).sort();
  };

  // Calculate totals
  const totalDebits = filteredTransactions.reduce((sum, t) => sum + (t.DebitAmount || 0), 0);
  const totalCredits = filteredTransactions.reduce((sum, t) => sum + (t.CreditAmount || 0), 0);
  const totalTaxAmount = filteredTransactions.reduce((sum, t) => sum + (t.LineTaxAmount || 0), 0);

  // Get selected references
  const selectedCompany = companies.find((c) => c.CompanyID === parseInt(selectedCompanyId));
  const selectedFiscalYear = fiscalYears.find((fy) => fy.FiscalYearID === parseInt(selectedFiscalYearId));

  if (initialLoading) {
    return (
      <div className="w-full px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-6 xl:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/general-ledger")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">GL Transactions</h1>
            <p className="text-muted-foreground">Detailed general ledger transaction listing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={filteredTransactions.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Transaction Filters
          </CardTitle>
          <CardDescription>Filter transactions by various criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.CompanyID} value={company.CompanyID.toString()}>
                      {company.CompanyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Fiscal Year</Label>
              <Select value={selectedFiscalYearId} onValueChange={handleFiscalYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Fiscal Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Fiscal Years</SelectItem>
                  {getFilteredFiscalYears().map((fy) => (
                    <SelectItem key={fy.FiscalYearID} value={fy.FiscalYearID.toString()}>
                      {fy.FYCode} - {fy.FYDescription}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.AccountID} value={account.AccountID.toString()}>
                      {account.AccountCode} - {account.AccountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucherType">Voucher Type</Label>
              <Select value={selectedVoucherType} onValueChange={setSelectedVoucherType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Types</SelectItem>
                  {getVoucherTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postingStatus">Posting Status</Label>
              <Select value={selectedPostingStatus} onValueChange={setSelectedPostingStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Statuses</SelectItem>
                  {getPostingStatuses().map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reversed">Show Reversed</Label>
              <Select value={showReversedTransactions} onValueChange={setShowReversedTransactions}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Hide Reversed</SelectItem>
                  <SelectItem value="true">Show Only Reversed</SelectItem>
                  <SelectItem value="0">Show All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {showTaxColumns && (
              <div className="flex items-center space-x-2">
                <Switch id="showTaxColumns" checked={showTaxColumns} onCheckedChange={setShowTaxColumns} />
                <Label htmlFor="showTaxColumns">Show Tax Columns</Label>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRefresh} disabled={!selectedCompanyId || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Apply Filters"
              )}
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Header Info */}
      {transactions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedCompany?.CompanyName}</p>
                  <p className="text-sm text-muted-foreground">{selectedFiscalYear?.FYDescription || "All Periods"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="text-right">
                  <p className="font-medium">{fromDate && toDate ? `${format(new Date(fromDate), "MMM dd")} - ${format(new Date(toDate), "MMM dd, yyyy")}` : "All Dates"}</p>
                  <p className="text-sm text-muted-foreground">{filteredTransactions.length} transactions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Stats */}
      {transactions.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search transactions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {filteredTransactions.length} of {transactions.length} transactions
            </Badge>
            {showTaxColumns && (
              <Badge variant="secondary">
                <Info className="mr-1 h-3 w-3" />
                Tax Details Available
              </Badge>
            )}
            <div className="text-sm text-muted-foreground">
              Debits: {formatCurrency(totalDebits)} | Credits: {formatCurrency(totalCredits)}
              {showTaxColumns && totalTaxAmount > 0 && ` | Tax: ${formatCurrency(totalTaxAmount)}`}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {transactions.length > 0 ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>General Ledger Transactions</CardTitle>
            <CardDescription>Detailed transaction listing {selectedFiscalYear ? `for ${selectedFiscalYear.FYDescription}` : ""}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[120px]">Voucher No</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[150px]">Account</TableHead>
                    <TableHead className="min-w-[200px]">Description</TableHead>
                    <TableHead>Reference</TableHead>
                    {showTaxColumns && (
                      <>
                        <TableHead className="text-right">Base Amount</TableHead>
                        <TableHead>Tax</TableHead>
                        <TableHead className="text-right">Tax Amount</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="w-[60px]">Status</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.PostingID} className={transaction.IsReversed ? "bg-red-50" : ""}>
                      <TableCell className="text-sm">{format(new Date(transaction.PostingDate), "MMM dd, yy")}</TableCell>
                      <TableCell className="font-medium text-sm">{transaction.VoucherNo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {transaction.VoucherType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{transaction.AccountCode}</div>
                          <div className="text-xs text-muted-foreground truncate">{transaction.AccountName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{transaction.Description}</div>
                          {transaction.Narration && <div className="text-xs text-muted-foreground">{transaction.Narration}</div>}
                          {(transaction.CustomerFullName || transaction.SupplierName) && (
                            <div className="text-xs text-blue-600">{transaction.CustomerFullName || transaction.SupplierName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.ReferenceNo && (
                          <div>
                            <div className="text-xs text-muted-foreground">{transaction.ReferenceType}</div>
                            <div>{transaction.ReferenceNo}</div>
                          </div>
                        )}
                        {transaction.ChequeNo && <div className="text-xs text-muted-foreground">Cheque: {transaction.ChequeNo}</div>}
                      </TableCell>
                      {showTaxColumns && (
                        <>
                          <TableCell className="text-right text-sm">{transaction.BaseAmount ? formatCurrency(transaction.BaseAmount) : "-"}</TableCell>
                          <TableCell className="text-sm">
                            {transaction.TaxCode && (
                              <div>
                                <div className="font-medium">{transaction.TaxCode}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatPercentage(transaction.TaxPercentage)}
                                  {transaction.IsTaxInclusive && " (Incl.)"}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm">{transaction.LineTaxAmount ? formatCurrency(transaction.LineTaxAmount) : "-"}</TableCell>
                        </>
                      )}
                      <TableCell className="text-right font-medium text-green-600">{transaction.DebitAmount ? formatCurrency(transaction.DebitAmount) : "-"}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">{transaction.CreditAmount ? formatCurrency(transaction.CreditAmount) : "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={transaction.PostingStatus === "Posted" ? "default" : "secondary"} className="text-xs">
                            {transaction.PostingStatus}
                          </Badge>
                          {transaction.IsReversed && (
                            <Badge variant="destructive" className="text-xs">
                              Reversed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handlePreviewSlip(transaction)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview Slip
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewAccountLedger(transaction.AccountID)}>View Account Ledger</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toast.info("Transaction details view will be implemented")}>View Details</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals Summary */}
            <div className="mt-4 p-4 bg-muted rounded-md mx-4 md:mx-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">Total Transactions</p>
                  <p className="font-bold text-lg">{filteredTransactions.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Total Debits</p>
                  <p className="font-bold text-lg text-green-600">{formatCurrency(totalDebits)}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Total Credits</p>
                  <p className="font-bold text-lg text-red-600">{formatCurrency(totalCredits)}</p>
                </div>
                {showTaxColumns && totalTaxAmount > 0 && (
                  <div className="text-center">
                    <p className="text-muted-foreground">Total Tax Amount</p>
                    <p className="font-bold text-lg text-orange-600">{formatCurrency(totalTaxAmount)}</p>
                  </div>
                )}
              </div>

              {/* Balance Check */}
              <div className="mt-3 text-center">
                <div
                  className={`inline-flex items-center gap-2 p-2 rounded ${
                    Math.abs(totalDebits - totalCredits) < 0.01 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {Math.abs(totalDebits - totalCredits) < 0.01 ? "✓" : "⚠"}
                  Balance Check:
                  {Math.abs(totalDebits - totalCredits) < 0.01 ? "In Balance" : `Out of Balance by ${formatCurrency(Math.abs(totalDebits - totalCredits))}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">{selectedCompanyId ? "No transactions found for the selected criteria" : "Select a company to view GL transactions"}</p>
            <Button onClick={handleRefresh} disabled={!selectedCompanyId}>
              Load Transactions
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {/* Transaction Slip Preview Modal */}
      {previewTransaction && (
        <GLTransactionSlipPreview
          isOpen={showPreview}
          onClose={handleClosePreview}
          transaction={{
            VoucherNo: previewTransaction.VoucherNo,
            VoucherType: previewTransaction.VoucherType,
            CompanyID: previewTransaction.CompanyID,
            TransactionID: previewTransaction.TransactionID,
            PostingID: previewTransaction.PostingID,
            ReferenceType: previewTransaction.ReferenceType,
            ReferenceNo: previewTransaction.ReferenceNo,
            ReferenceID: previewTransaction.ReferenceID,
          }}
        />
      )}
    </div>
  );
};

export default GLTransactions;
