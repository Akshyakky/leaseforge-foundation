// src/pages/generalLedger/ChartOfAccounts.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Download, Filter, Search, Building, RefreshCw, BookOpen, Eye, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { generalLedgerService } from "@/services/generalLedgerService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { companyService } from "@/services/companyService";
import { ChartOfAccountsItem } from "@/types/generalLedgerTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { debounce } from "lodash";

const ChartOfAccounts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [accounts, setAccounts] = useState<ChartOfAccountsItem[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccountsItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [balanceAsOfDate, setBalanceAsOfDate] = useState<string>("");
  const [isActiveOnly, setIsActiveOnly] = useState(true);
  const [isPostableOnly, setIsPostableOnly] = useState(false);
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  // Initialize component
  useEffect(() => {
    initializeComponent();
  }, []);

  // Debounced search function
  const debouncedSearch = debounce(() => {
    if (accounts.length > 0) {
      const filtered = accounts.filter(
        (account) =>
          account.AccountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.AccountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.AccountTypeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.Description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAccounts(filtered);
    }
  }, 300);

  // Handle search input change
  useEffect(() => {
    debouncedSearch();
  }, [searchTerm, accounts]);

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

      // Set default balance as of date to today
      setBalanceAsOfDate(format(new Date(), "yyyy-MM-dd"));

      // Load chart of accounts if we have required data
      if (companyId) {
        await fetchChartOfAccounts(parseInt(companyId));
      }
    } catch (error) {
      console.error("Error initializing component:", error);
      toast.error("Failed to load chart of accounts data");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchChartOfAccounts = async (companyId?: number) => {
    const targetCompanyId = companyId || parseInt(selectedCompanyId);

    if (!targetCompanyId) {
      toast.error("Please select a company");
      return;
    }

    try {
      setLoading(true);

      const response = await generalLedgerService.getChartOfAccountsWithBalances({
        companyID: targetCompanyId,
        fiscalYearID: selectedFiscalYearId ? parseInt(selectedFiscalYearId) : undefined,
        balanceAsOfDate: balanceAsOfDate || undefined,
        isActiveOnly,
        isPostableOnly,
        showZeroBalances,
      });

      setAccounts(response);
      setFilteredAccounts(response);

      if (response.length === 0) {
        toast.info("No accounts found for the selected criteria");
      }
    } catch (error) {
      console.error("Error fetching chart of accounts:", error);
      toast.error("Failed to load chart of accounts");
      setAccounts([]);
      setFilteredAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    setAccounts([]);
    setFilteredAccounts([]);

    if (value) {
      fetchChartOfAccounts(parseInt(value));
    }
  };

  const handleFiscalYearChange = (value: string) => {
    setSelectedFiscalYearId(value);
    setAccounts([]);
    setFilteredAccounts([]);
  };

  const handleRefresh = () => {
    fetchChartOfAccounts();
  };

  const handleExport = () => {
    toast.info("Export functionality will be implemented");
  };

  const handleViewAccountLedger = (accountId: number) => {
    const params = new URLSearchParams({
      companyId: selectedCompanyId,
      fiscalYearId: selectedFiscalYearId || "",
      accountId: accountId.toString(),
    });
    navigate(`/general-ledger/account-ledger?${params.toString()}`);
  };

  const handleViewAccountActivity = (accountId: number) => {
    const params = new URLSearchParams({
      accountId: accountId.toString(),
    });
    navigate(`/general-ledger/account-activity?${params.toString()}`);
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

  const resetFilters = () => {
    setIsActiveOnly(true);
    setIsPostableOnly(false);
    setShowZeroBalances(false);
    setSearchTerm("");
    setBalanceAsOfDate(format(new Date(), "yyyy-MM-dd"));
  };

  // Calculate totals
  const totalBalance = filteredAccounts.reduce((sum, account) => sum + Math.abs(account.CurrentBalance), 0);
  const activeAccountsCount = filteredAccounts.filter((account) => account.IsActive).length;
  const postableAccountsCount = filteredAccounts.filter((account) => account.IsPostable).length;

  // Get selected company info
  const selectedCompany = companies.find((c) => c.CompanyID === parseInt(selectedCompanyId));
  const selectedFiscalYear = fiscalYears.find((fy) => fy.FiscalYearID === parseInt(selectedFiscalYearId));

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
            <h1 className="text-2xl font-semibold">Chart of Accounts</h1>
            <p className="text-muted-foreground">Complete listing of accounts with current balances</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={filteredAccounts.length === 0}>
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
            Account Filters
          </CardTitle>
          <CardDescription>Filter accounts by various criteria</CardDescription>
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
              <Label htmlFor="fiscalYear">Fiscal Year (Optional)</Label>
              <Select value={selectedFiscalYearId} onValueChange={handleFiscalYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Fiscal Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Current Year</SelectItem>
                  {getFilteredFiscalYears().map((fy) => (
                    <SelectItem key={fy.FiscalYearID} value={fy.FiscalYearID.toString()}>
                      {fy.FYCode} - {fy.FYDescription}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="asOfDate">Balance As Of Date</Label>
              <Input id="asOfDate" type="date" value={balanceAsOfDate} onChange={(e) => setBalanceAsOfDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch id="activeOnly" checked={isActiveOnly} onCheckedChange={setIsActiveOnly} />
              <Label htmlFor="activeOnly">Active Accounts Only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="postableOnly" checked={isPostableOnly} onCheckedChange={setIsPostableOnly} />
              <Label htmlFor="postableOnly">Postable Accounts Only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="showZero" checked={showZeroBalances} onCheckedChange={setShowZeroBalances} />
              <Label htmlFor="showZero">Show Zero Balances</Label>
            </div>
          </div>

          <div className="flex gap-2">
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
      {accounts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedCompany?.CompanyName}</p>
                  <p className="text-sm text-muted-foreground">{selectedFiscalYear?.FYDescription || "Current Period"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div className="text-right">
                  <p className="font-medium">As of {balanceAsOfDate ? format(new Date(balanceAsOfDate), "PPP") : "Today"}</p>
                  <p className="text-sm text-muted-foreground">{filteredAccounts.length} accounts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Stats */}
      {accounts.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {filteredAccounts.length} of {accounts.length} accounts
            </Badge>
            <div className="text-sm text-muted-foreground">
              Active: {activeAccountsCount} | Postable: {postableAccountsCount}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Accounts</p>
              <p className="text-2xl font-bold">{filteredAccounts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Active Accounts</p>
              <p className="text-2xl font-bold text-green-600">{activeAccountsCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Postable Accounts</p>
              <p className="text-2xl font-bold text-blue-600">{postableAccountsCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounts Table */}
      {accounts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Account Listing</CardTitle>
            <CardDescription>Complete chart of accounts with current balances and transaction counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Account Code</TableHead>
                    <TableHead className="min-w-[200px]">Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Current Balance</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead className="text-center">Last Activity</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.AccountID}>
                      <TableCell className="font-medium">{account.AccountCode}</TableCell>
                      <TableCell>
                        <div style={{ paddingLeft: `${(account.AccountLevel - 1) * 20}px` }}>
                          <div className="font-medium">{account.AccountName}</div>
                          {account.Description && <div className="text-xs text-muted-foreground">{account.Description}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.AccountTypeName}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{account.AccountLevel}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={account.CurrentBalance >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(account.CurrentBalance)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {account.TransactionCount > 0 ? <Badge variant="secondary">{account.TransactionCount}</Badge> : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {account.LastTransactionDate ? (
                          <span className="text-sm">{format(new Date(account.LastTransactionDate), "MMM dd, yyyy")}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Badge variant={account.IsActive ? "default" : "secondary"} className="text-xs">
                            {account.IsActive ? "Active" : "Inactive"}
                          </Badge>
                          {account.IsPostable && (
                            <Badge variant="outline" className="text-xs">
                              Postable
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewAccountLedger(account.AccountID)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Ledger
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewAccountActivity(account.AccountID)}>
                              <BookOpen className="mr-2 h-4 w-4" />
                              Account Activity
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toast.info("Account details view will be implemented")}>View Details</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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
            <p className="text-muted-foreground mb-4">{selectedCompanyId ? "No accounts found for the selected criteria" : "Select a company to view chart of accounts"}</p>
            <Button onClick={handleRefresh} disabled={!selectedCompanyId}>
              Load Accounts
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default ChartOfAccounts;
