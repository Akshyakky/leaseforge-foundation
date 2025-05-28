// src/pages/generalLedger/IncomeStatement.tsx
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
import { IncomeStatementResponse, IncomeStatementItem } from "@/types/generalLedgerTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const IncomeStatement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementResponse | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
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

      // Set default date range to fiscal year period
      if (fiscalYearId) {
        const fiscalYear = fiscalYearsData.find((fy) => fy.FiscalYearID === parseInt(fiscalYearId));
        if (fiscalYear) {
          setFromDate(format(new Date(fiscalYear.StartDate), "yyyy-MM-dd"));
          setToDate(format(new Date(fiscalYear.EndDate), "yyyy-MM-dd"));
        }
      }

      // Load income statement if we have required data
      if (companyId && fiscalYearId) {
        await fetchIncomeStatement(parseInt(companyId), parseInt(fiscalYearId));
      }
    } catch (error) {
      console.error("Error initializing component:", error);
      toast.error("Failed to load income statement data");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchIncomeStatement = async (companyId?: number, fiscalYearId?: number) => {
    const targetCompanyId = companyId || parseInt(selectedCompanyId);
    const targetFiscalYearId = fiscalYearId || parseInt(selectedFiscalYearId);

    if (!targetCompanyId || !targetFiscalYearId) {
      toast.error("Please select both company and fiscal year");
      return;
    }

    try {
      setLoading(true);

      const response = await generalLedgerService.getIncomeStatement({
        companyID: targetCompanyId,
        fiscalYearID: targetFiscalYearId,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        showZeroBalances,
      });

      setIncomeStatement(response);

      if (response.items.length === 0) {
        toast.info("No income statement data found for the selected criteria");
      }
    } catch (error) {
      console.error("Error fetching income statement:", error);
      toast.error("Failed to load income statement");
      setIncomeStatement(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    setIncomeStatement(null);
  };

  const handleFiscalYearChange = (value: string) => {
    setSelectedFiscalYearId(value);
    setIncomeStatement(null);

    // Update default date range
    const fiscalYear = fiscalYears.find((fy) => fy.FiscalYearID === parseInt(value));
    if (fiscalYear) {
      setFromDate(format(new Date(fiscalYear.StartDate), "yyyy-MM-dd"));
      setToDate(format(new Date(fiscalYear.EndDate), "yyyy-MM-dd"));
    }
  };

  const handleRefresh = () => {
    fetchIncomeStatement();
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
    if (!incomeStatement) return [];
    return incomeStatement.items
      .filter((item) => item.PLCategory === category)
      .filter(
        (item) => searchTerm === "" || item.AccountCode.toLowerCase().includes(searchTerm.toLowerCase()) || item.AccountName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const getCategoryTotal = (category: string): number => {
    const categoryItems = getItemsByCategory(category);
    return categoryItems.reduce((sum, item) => sum + item.NetAmount, 0);
  };

  // Calculate totals
  const revenueTotal = getCategoryTotal("REVENUE");
  const expensesTotal = getCategoryTotal("EXPENSES");
  const netIncome = revenueTotal - expensesTotal;

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
            <h1 className="text-2xl font-semibold">Income Statement</h1>
            <p className="text-muted-foreground">Statement of revenues and expenses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!incomeStatement}>
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
          <CardDescription>Select criteria for the income statement report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
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
      {incomeStatement && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedCompany?.CompanyName}</p>
                  <p className="text-sm text-muted-foreground">Income Statement</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-right">
                  <p className="font-medium">{fromDate && toDate ? `${format(new Date(fromDate), "MMM dd")} - ${format(new Date(toDate), "MMM dd, yyyy")}` : "Full Period"}</p>
                  <p className="text-sm text-muted-foreground">{incomeStatement.items.length} accounts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {incomeStatement && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Input placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      )}

      {/* Income Statement */}
      {incomeStatement ? (
        <div className="space-y-6">
          {/* Revenue Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Revenue
              </CardTitle>
              <CardDescription>Income generated from operations</CardDescription>
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
                  {getItemsByCategory("REVENUE").map((item) => (
                    <TableRow key={item.AccountID}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.AccountName}</div>
                          <div className="text-sm text-muted-foreground">{item.AccountCode}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.NetAmount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold">Total Revenue</TableCell>
                    <TableCell className="text-right font-bold text-lg text-green-600">{formatCurrency(revenueTotal)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Expenses Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Expenses
              </CardTitle>
              <CardDescription>Costs incurred in operations</CardDescription>
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
                  {getItemsByCategory("EXPENSES").map((item) => (
                    <TableRow key={item.AccountID}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.AccountName}</div>
                          <div className="text-sm text-muted-foreground">{item.AccountCode}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.NetAmount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold">Total Expenses</TableCell>
                    <TableCell className="text-right font-bold text-lg text-red-600">{formatCurrency(expensesTotal)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">Select company and fiscal year to generate income statement</p>
            <Button onClick={handleRefresh} disabled={!selectedCompanyId || !selectedFiscalYearId}>
              Generate Report
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Net Income Summary */}
      {incomeStatement && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(revenueTotal)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(expensesTotal)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className={`text-xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(netIncome)}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 p-3 rounded-lg ${netIncome >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {netIncome >= 0 ? "📈" : "📉"}
                {netIncome >= 0 ? "Profit" : "Loss"}: {formatCurrency(Math.abs(netIncome))}
                <Badge variant={netIncome >= 0 ? "default" : "destructive"}>{((netIncome / (revenueTotal || 1)) * 100).toFixed(1)}% of Revenue</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IncomeStatement;
