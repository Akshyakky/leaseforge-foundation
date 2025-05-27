// src/pages/generalLedger/AccountLedger.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Download, Filter, Calendar, Building, RefreshCw, Search, BookOpen } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generalLedgerService } from "@/services/generalLedgerService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { companyService } from "@/services/companyService";
import { accountService } from "@/services/accountService";
import { AccountLedgerResponse, AccountLedgerTransaction } from "@/types/generalLedgerTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";
import { Account } from "@/types/accountTypes";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const AccountLedger = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [accountLedger, setAccountLedger] = useState<AccountLedgerResponse | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<AccountLedgerTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [includeOpeningBalances, setIncludeOpeningBalances] = useState(true);
  const [includeClosingBalances, setIncludeClosingBalances] = useState(true);
  const [selectedVoucherType, setSelectedVoucherType] = useState<string>("");

  // Initialize component
  useEffect(() => {
    initializeComponent();
  }, []);

  // Filter transactions when search term changes
  useEffect(() => {
    if (accountLedger) {
      const filtered = accountLedger.transactions.filter(
        (transaction) =>
          transaction.VoucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.Narration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.CustomerFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.SupplierName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTransactions(filtered);
    }
  }, [searchTerm, accountLedger]);

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
      const accountId = searchParams.get("accountId") || "";

      setSelectedCompanyId(companyId);
      setSelectedFiscalYearId(fiscalYearId);
      setSelectedAccountId(accountId);

      // Fetch accounts for the selected company
      if (companyId) {
        await fetchAccounts();
      }

      // Set default date range to fiscal year period
      if (fiscalYearId) {
        const fiscalYear = fiscalYearsData.find((fy) => fy.FiscalYearID === parseInt(fiscalYearId));
        if (fiscalYear) {
          setFromDate(format(new Date(fiscalYear.StartDate), "yyyy-MM-dd"));
          setToDate(format(new Date(fiscalYear.EndDate), "yyyy-MM-dd"));
        }
      }

      // Load account ledger if we have required data
      if (companyId && fiscalYearId && accountId) {
        await fetchAccountLedger(parseInt(accountId));
      }
    } catch (error) {
      console.error("Error initializing component:", error);
      toast.error("Failed to load account ledger data");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const accountsData = await accountService.searchAccounts({
        companyID: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
        isActive: true,
        isPostable: true,
      });
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    }
  };

  const fetchAccountLedger = async (accountId?: number) => {
    const targetAccountId = accountId || parseInt(selectedAccountId);

    if (!targetAccountId || !selectedCompanyId || !selectedFiscalYearId) {
      toast.error("Please select company, fiscal year, and account");
      return;
    }

    try {
      setLoading(true);

      const response = await generalLedgerService.getAccountLedger({
        accountID: targetAccountId,
        companyID: parseInt(selectedCompanyId),
        fiscalYearID: parseInt(selectedFiscalYearId),
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        includeOpeningBalances,
        includeClosingBalances,
        voucherType: selectedVoucherType || undefined,
      });

      setAccountLedger(response);
      setFilteredTransactions(response.transactions);

      if (response.transactions.length === 0) {
        toast.info("No transactions found for the selected account and period");
      }
    } catch (error) {
      console.error("Error fetching account ledger:", error);
      toast.error("Failed to load account ledger");
      setAccountLedger(null);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = async (value: string) => {
    setSelectedCompanyId(value);
    setSelectedAccountId("");
    setAccountLedger(null);
    setFilteredTransactions([]);

    if (value) {
      await fetchAccounts();
    }
  };

  const handleFiscalYearChange = (value: string) => {
    setSelectedFiscalYearId(value);
    setAccountLedger(null);
    setFilteredTransactions([]);

    // Update default date range
    const fiscalYear = fiscalYears.find((fy) => fy.FiscalYearID === parseInt(value));
    if (fiscalYear) {
      setFromDate(format(new Date(fiscalYear.StartDate), "yyyy-MM-dd"));
      setToDate(format(new Date(fiscalYear.EndDate), "yyyy-MM-dd"));
    }
  };

  const handleAccountChange = (value: string) => {
    setSelectedAccountId(value);
    setAccountLedger(null);
    setFilteredTransactions([]);
  };

  const handleRefresh = () => {
    fetchAccountLedger();
  };

  const handleExport = () => {
    toast.info("Export functionality will be implemented");
  };

  const formatCurrency = (amount: number): string => {
    if (amount === 0) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getFilteredFiscalYears = () => {
    if (!selectedCompanyId) return fiscalYears;
    return fiscalYears.filter((fy) => fy.CompanyID === parseInt(selectedCompanyId));
  };

  const getVoucherTypes = () => {
    if (!accountLedger) return [];
    const types = new Set(accountLedger.transactions.map((t) => t.VoucherType));
    return Array.from(types).filter(Boolean);
  };

  // Get selected references
  const selectedCompany = companies.find((c) => c.CompanyID === parseInt(selectedCompanyId));
  const selectedFiscalYear = fiscalYears.find((fy) => fy.FiscalYearID === parseInt(selectedFiscalYearId));
  const selectedAccount = accounts.find((a) => a.AccountID === parseInt(selectedAccountId));

  if (initialLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/general-ledger")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Account Ledger</h1>
            <p className="text-muted-foreground">Detailed account transactions with running balance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!accountLedger}>
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
            Report Parameters
          </CardTitle>
          <CardDescription>Select criteria for the account ledger report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {getFilteredFiscalYears().map((fy) => (
                    <SelectItem key={fy.FiscalYearID} value={fy.FiscalYearID.toString()}>
                      {fy.FYCode} - {fy.FYDescription}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select value={selectedAccountId} onValueChange={handleAccountChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.AccountID} value={account.AccountID.toString()}>
                      {account.AccountCode} - {account.AccountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucherType">Voucher Type (Optional)</Label>
              <Select value={selectedVoucherType} onValueChange={setSelectedVoucherType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Voucher Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Voucher Types</SelectItem>
                  {getVoucherTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch id="includeOpening" checked={includeOpeningBalances} onCheckedChange={setIncludeOpeningBalances} />
              <Label htmlFor="includeOpening">Include Opening Balance</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="includeClosing" checked={includeClosingBalances} onCheckedChange={setIncludeClosingBalances} />
              <Label htmlFor="includeClosing">Include Closing Balance</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={!selectedCompanyId || !selectedFiscalYearId || !selectedAccountId || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      {accountLedger?.accountInfo && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {accountLedger.accountInfo.AccountCode} - {accountLedger.accountInfo.AccountName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {accountLedger.accountInfo.AccountTypeName} | {selectedCompany?.CompanyName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-right">
                  <p className="font-medium">{fromDate && toDate ? `${format(new Date(fromDate), "MMM dd")} - ${format(new Date(toDate), "MMM dd, yyyy")}` : "All Dates"}</p>
                  <p className="text-sm text-muted-foreground">{filteredTransactions.length} transactions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Summary */}
      {accountLedger && (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transactions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Badge variant="outline">
              {filteredTransactions.length} of {accountLedger.transactions.length} transactions
            </Badge>
          </div>

          {/* Account Summary */}
          {accountLedger.summary && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Opening Balance</p>
                    <p className="font-medium text-lg">{formatCurrency(accountLedger.summary.OpeningBalance)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Total Debits</p>
                    <p className="font-medium text-lg text-green-600">{formatCurrency(accountLedger.summary.TotalDebits)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Total Credits</p>
                    <p className="font-medium text-lg text-red-600">{formatCurrency(accountLedger.summary.TotalCredits)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Closing Balance</p>
                    <p className="font-medium text-lg">{formatCurrency(accountLedger.summary.ClosingBalance)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Transactions</p>
                    <p className="font-medium text-lg">{accountLedger.summary.TransactionCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Transactions Table */}
      {accountLedger ? (
        <Card>
          <CardHeader>
            <CardTitle>Account Transactions</CardTitle>
            <CardDescription>Detailed transaction listing with running balance for {selectedAccount?.AccountName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[120px]">Voucher No</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="min-w-[200px]">Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.PostingID}>
                      <TableCell className="text-sm">{format(new Date(transaction.PostingDate), "MMM dd")}</TableCell>
                      <TableCell className="font-medium text-sm">{transaction.VoucherNo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {transaction.VoucherType}
                        </Badge>
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
                            <div>{transaction.ReferenceType}</div>
                            <div className="text-muted-foreground">{transaction.ReferenceNo}</div>
                          </div>
                        )}
                        {transaction.ChequeNo && <div className="text-xs text-muted-foreground">Cheque: {transaction.ChequeNo}</div>}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">{transaction.DebitAmount ? formatCurrency(transaction.DebitAmount) : "-"}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">{transaction.CreditAmount ? formatCurrency(transaction.CreditAmount) : "-"}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(transaction.RunningBalance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">Select company, fiscal year, and account to view ledger</p>
            <Button onClick={handleRefresh} disabled={!selectedCompanyId || !selectedFiscalYearId || !selectedAccountId}>
              Generate Report
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default AccountLedger;
