// src/pages/generalLedger/BalanceSheet.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Download, Filter, Calendar, Building, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generalLedgerService } from "@/services/generalLedgerService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { companyService } from "@/services/companyService";
import { BalanceSheetResponse, BalanceSheetItem } from "@/types/generalLedgerTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const BalanceSheet = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetResponse | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [balanceAsOfDate, setBalanceAsOfDate] = useState<string>("");
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  // Initialize component
  useEffect(() => {
    initializeComponent();
  }, []);

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

      // Load balance sheet if we have required data
      if (companyId && fiscalYearId) {
        await fetchBalanceSheet(parseInt(companyId), parseInt(fiscalYearId));
      }
    } catch (error) {
      console.error("Error initializing component:", error);
      toast.error("Failed to load balance sheet data");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchBalanceSheet = async (companyId?: number, fiscalYearId?: number, asOfDate?: string) => {
    const targetCompanyId = companyId || parseInt(selectedCompanyId);
    const targetFiscalYearId = fiscalYearId || parseInt(selectedFiscalYearId);
    const targetAsOfDate = asOfDate || balanceAsOfDate;

    if (!targetCompanyId || !targetFiscalYearId) {
      toast.error("Please select both company and fiscal year");
      return;
    }

    try {
      setLoading(true);

      const response = await generalLedgerService.getBalanceSheet({
        companyID: targetCompanyId,
        fiscalYearID: targetFiscalYearId,
        balanceAsOfDate: targetAsOfDate || undefined,
        showZeroBalances,
      });

      setBalanceSheet(response);

      if (response.items.length === 0) {
        toast.info("No balance sheet data found for the selected criteria");
      }
    } catch (error) {
      console.error("Error fetching balance sheet:", error);
      toast.error("Failed to load balance sheet");
      setBalanceSheet(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    setBalanceSheet(null);
  };

  const handleFiscalYearChange = (value: string) => {
    setSelectedFiscalYearId(value);
    setBalanceSheet(null);

    // Update default balance as of date
    const fiscalYear = fiscalYears.find((fy) => fy.FiscalYearID === parseInt(value));
    if (fiscalYear) {
      setBalanceAsOfDate(format(new Date(fiscalYear.EndDate), "yyyy-MM-dd"));
    }
  };

  const handleRefresh = () => {
    fetchBalanceSheet();
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

  const getItemsByCategory = (category: string) => {
    if (!balanceSheet) return [];
    return balanceSheet.items
      .filter((item) => item.BSCategory === category)
      .filter(
        (item) => searchTerm === "" || item.AccountCode.toLowerCase().includes(searchTerm.toLowerCase()) || item.AccountName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const getCategoryTotal = (category: string): number => {
    const categoryTotal = balanceSheet?.categoryTotals.find((ct) => ct.BSCategory === category);
    return categoryTotal?.Total || 0;
  };

  // Calculate balance sheet balancing
  const assetsTotal = getCategoryTotal("ASSETS");
  const liabilitiesTotal = getCategoryTotal("LIABILITIES");
  const equityTotal = getCategoryTotal("EQUITY");
  const liabilitiesAndEquity = liabilitiesTotal + equityTotal;
  const isBalanced = Math.abs(assetsTotal - liabilitiesAndEquity) < 0.01;

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
            <h1 className="text-2xl font-semibold">Balance Sheet</h1>
            <p className="text-muted-foreground">Statement of financial position</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!balanceSheet}>
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
          <CardDescription>Select criteria for the balance sheet report</CardDescription>
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
              <Label htmlFor="asOfDate">As Of Date</Label>
              <Input id="asOfDate" type="date" value={balanceAsOfDate} onChange={(e) => setBalanceAsOfDate(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="showZero" checked={showZeroBalances} onCheckedChange={setShowZeroBalances} />
            <Label htmlFor="showZero">Show Zero Balances</Label>
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
      {balanceSheet && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedCompany?.CompanyName}</p>
                  <p className="text-sm text-muted-foreground">Balance Sheet</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-right">
                  <p className="font-medium">As of {balanceAsOfDate ? format(new Date(balanceAsOfDate), "PPP") : "Period End"}</p>
                  <p className="text-sm text-muted-foreground">
                    {isBalanced ? <span className="text-green-600">✓ Balanced</span> : <span className="text-red-600">⚠ Out of Balance</span>}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {balanceSheet && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Input placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {balanceSheet ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Assets
              </CardTitle>
              <CardDescription>Resources owned by the company</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getItemsByCategory("ASSETS").map((item) => (
                    <TableRow key={item.AccountID}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.AccountName}</div>
                          <div className="text-sm text-muted-foreground">{item.AccountCode}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.Balance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold">Total Assets</TableCell>
                    <TableCell className="text-right font-bold text-lg">{formatCurrency(assetsTotal)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Liabilities and Equity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Liabilities & Equity
              </CardTitle>
              <CardDescription>Obligations and ownership claims</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Liabilities */}
                  {getItemsByCategory("LIABILITIES").length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={2} className="font-semibold text-red-600 bg-red-50">
                          LIABILITIES
                        </TableCell>
                      </TableRow>
                      {getItemsByCategory("LIABILITIES").map((item) => (
                        <TableRow key={item.AccountID}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.AccountName}</div>
                              <div className="text-sm text-muted-foreground">{item.AccountCode}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.Balance)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-semibold">Total Liabilities</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(liabilitiesTotal)}</TableCell>
                      </TableRow>
                    </>
                  )}

                  {/* Equity */}
                  {getItemsByCategory("EQUITY").length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={2} className="font-semibold text-blue-600 bg-blue-50">
                          EQUITY
                        </TableCell>
                      </TableRow>
                      {getItemsByCategory("EQUITY").map((item) => (
                        <TableRow key={item.AccountID}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.AccountName}</div>
                              <div className="text-sm text-muted-foreground">{item.AccountCode}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.Balance)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-semibold">Total Equity</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(equityTotal)}</TableCell>
                      </TableRow>
                    </>
                  )}

                  <TableRow className="border-t-2">
                    <TableCell className="font-bold">Total Liabilities & Equity</TableCell>
                    <TableCell className="text-right font-bold text-lg">{formatCurrency(liabilitiesAndEquity)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">Select company and fiscal year to generate balance sheet</p>
            <Button onClick={handleRefresh} disabled={!selectedCompanyId || !selectedFiscalYearId}>
              Generate Report
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Balance Check Summary */}
      {balanceSheet && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(assetsTotal)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Liabilities</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(liabilitiesTotal)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Equity</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(equityTotal)}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 p-3 rounded-lg ${isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {isBalanced ? "✓" : "⚠"} Balance Check: Assets = Liabilities + Equity
                <Badge variant={isBalanced ? "default" : "destructive"}>
                  {isBalanced ? "Balanced" : `Difference: ${formatCurrency(Math.abs(assetsTotal - liabilitiesAndEquity))}`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BalanceSheet;
