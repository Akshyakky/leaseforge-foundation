// src/pages/generalLedger/TrialBalance.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Download, Filter, Calendar, Building, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generalLedgerService } from "@/services/generalLedgerService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { companyService } from "@/services/companyService";
import { TrialBalanceResponse, TrialBalanceItem } from "@/types/generalLedgerTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const TrialBalance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceResponse | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [filteredItems, setFilteredItems] = useState<TrialBalanceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [balanceAsOfDate, setBalanceAsOfDate] = useState<string>("");
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [isActiveOnly, setIsActiveOnly] = useState(true);

  // Initialize component
  useEffect(() => {
    initializeComponent();
  }, []);

  // Filter items when search term changes
  useEffect(() => {
    if (trialBalance) {
      const filtered = trialBalance.items.filter(
        (item) =>
          item.AccountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.AccountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.AccountTypeName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, trialBalance]);

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

      // Set default balance as of date to fiscal year end date
      if (fiscalYearId) {
        const fiscalYear = fiscalYearsData.find((fy) => fy.FiscalYearID === parseInt(fiscalYearId));
        if (fiscalYear) {
          setBalanceAsOfDate(format(new Date(fiscalYear.EndDate), "yyyy-MM-dd"));
        }
      }

      // Load trial balance if we have required data
      if (companyId && fiscalYearId) {
        await fetchTrialBalance(parseInt(companyId), parseInt(fiscalYearId));
      }
    } catch (error) {
      console.error("Error initializing component:", error);
      toast.error("Failed to load trial balance data");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchTrialBalance = async (companyId?: number, fiscalYearId?: number, asOfDate?: string) => {
    const targetCompanyId = companyId || parseInt(selectedCompanyId);
    const targetFiscalYearId = fiscalYearId || parseInt(selectedFiscalYearId);
    const targetAsOfDate = asOfDate || balanceAsOfDate;

    if (!targetCompanyId || !targetFiscalYearId) {
      toast.error("Please select both company and fiscal year");
      return;
    }

    try {
      setLoading(true);

      const response = await generalLedgerService.getTrialBalance({
        companyID: targetCompanyId,
        fiscalYearID: targetFiscalYearId,
        balanceAsOfDate: targetAsOfDate || undefined,
        showZeroBalances,
        isActiveOnly,
      });

      setTrialBalance(response);
      setFilteredItems(response.items);

      if (response.items.length === 0) {
        toast.info("No trial balance data found for the selected criteria");
      }
    } catch (error) {
      console.error("Error fetching trial balance:", error);
      toast.error("Failed to load trial balance");
      setTrialBalance(null);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    setTrialBalance(null);
    setFilteredItems([]);
  };

  const handleFiscalYearChange = (value: string) => {
    setSelectedFiscalYearId(value);
    setTrialBalance(null);
    setFilteredItems([]);

    // Update default balance as of date
    const fiscalYear = fiscalYears.find((fy) => fy.FiscalYearID === parseInt(value));
    if (fiscalYear) {
      setBalanceAsOfDate(format(new Date(fiscalYear.EndDate), "yyyy-MM-dd"));
    }
  };

  const handleRefresh = () => {
    fetchTrialBalance();
  };

  const handleExport = () => {
    // Implementation for exporting trial balance
    toast.info("Export functionality will be implemented");
  };

  const formatCurrency = (amount: number): string => {
    if (amount === 0) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const getFilteredFiscalYears = () => {
    if (!selectedCompanyId) return fiscalYears;
    return fiscalYears.filter((fy) => fy.CompanyID === parseInt(selectedCompanyId));
  };

  // Get selected company and fiscal year info
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
            <h1 className="text-2xl font-semibold">Trial Balance</h1>
            <p className="text-muted-foreground">Account balances and totals summary</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!trialBalance}>
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
          <CardDescription>Select criteria for the trial balance report</CardDescription>
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
              <Label htmlFor="asOfDate">Balance As Of Date</Label>
              <Input id="asOfDate" type="date" value={balanceAsOfDate} onChange={(e) => setBalanceAsOfDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch id="showZero" checked={showZeroBalances} onCheckedChange={setShowZeroBalances} />
              <Label htmlFor="showZero">Show Zero Balances</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="activeOnly" checked={isActiveOnly} onCheckedChange={setIsActiveOnly} />
              <Label htmlFor="activeOnly">Active Accounts Only</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={!selectedCompanyId || !selectedFiscalYearId || loading}>
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

      {/* Report Header Info */}
      {trialBalance && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedCompany?.CompanyName}</p>
                  <p className="text-sm text-muted-foreground">{selectedFiscalYear?.FYDescription}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-right">
                  <p className="font-medium">As of {balanceAsOfDate ? format(new Date(balanceAsOfDate), "PPP") : "Period End"}</p>
                  <p className="text-sm text-muted-foreground">{filteredItems.length} accounts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {trialBalance && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Input placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Badge variant="outline">
            {filteredItems.length} of {trialBalance.items.length} accounts
          </Badge>
        </div>
      )}

      {/* Trial Balance Table */}
      {trialBalance ? (
        <Card>
          <CardHeader>
            <CardTitle>Trial Balance</CardTitle>
            <CardDescription>Account balances as of {balanceAsOfDate ? format(new Date(balanceAsOfDate), "PPP") : "period end"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Account Code</TableHead>
                    <TableHead className="min-w-[200px]">Account Name</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead className="text-right">Opening Debit</TableHead>
                    <TableHead className="text-right">Opening Credit</TableHead>
                    <TableHead className="text-right">Period Debit</TableHead>
                    <TableHead className="text-right">Period Credit</TableHead>
                    <TableHead className="text-right">Ending Debit</TableHead>
                    <TableHead className="text-right">Ending Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.AccountID}>
                      <TableCell className="font-medium">{item.AccountCode}</TableCell>
                      <TableCell>{item.AccountName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.AccountTypeName}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(item.OpeningDebit)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(item.OpeningCredit)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(item.PeriodDebit)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(item.PeriodCredit)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{formatCurrency(item.DebitBalance)}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">{formatCurrency(item.CreditBalance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            {trialBalance.totals && (
              <>
                <Separator className="my-4" />
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-semibold mb-3">Trial Balance Totals</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Opening Debits</p>
                      <p className="font-medium text-green-600">{formatCurrency(trialBalance.totals.TotalOpeningDebit)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Opening Credits</p>
                      <p className="font-medium text-red-600">{formatCurrency(trialBalance.totals.TotalOpeningCredit)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Period Debits</p>
                      <p className="font-medium text-green-600">{formatCurrency(trialBalance.totals.TotalPeriodDebit)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Period Credits</p>
                      <p className="font-medium text-red-600">{formatCurrency(trialBalance.totals.TotalPeriodCredit)}</p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Total Debits</p>
                      <p className="font-bold text-lg text-green-600">{formatCurrency(trialBalance.totals.GrandTotalDebit)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Credits</p>
                      <p className="font-bold text-lg text-red-600">{formatCurrency(trialBalance.totals.GrandTotalCredit)}</p>
                    </div>
                  </div>

                  {/* Balance Check */}
                  <div className="mt-3 p-2 rounded border">
                    <div className="flex items-center justify-between">
                      <span>Balance Check:</span>
                      <span
                        className={`font-medium ${Math.abs(trialBalance.totals.GrandTotalDebit - trialBalance.totals.GrandTotalCredit) < 0.01 ? "text-green-600" : "text-red-600"}`}
                      >
                        {Math.abs(trialBalance.totals.GrandTotalDebit - trialBalance.totals.GrandTotalCredit) < 0.01
                          ? "✓ In Balance"
                          : `⚠ Out of Balance by ${formatCurrency(Math.abs(trialBalance.totals.GrandTotalDebit - trialBalance.totals.GrandTotalCredit))}`}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">Select company and fiscal year to generate trial balance</p>
            <Button onClick={handleRefresh} disabled={!selectedCompanyId || !selectedFiscalYearId}>
              Generate Report
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default TrialBalance;
