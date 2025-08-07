// src/pages/generalLedger/GLSummary.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Download, Filter, Calendar, Building, RefreshCw, BarChart3, TrendingUp, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generalLedgerService } from "@/services/generalLedgerService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { companyService } from "@/services/companyService";
import { GLAccountTypeSummary } from "@/types/generalLedgerTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const GLSummary = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<GLAccountTypeSummary[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);

  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

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

      // Load GL summary if we have required data
      if (companyId) {
        await fetchGLSummary(parseInt(companyId));
      }
    } catch (error) {
      console.error("Error initializing component:", error);
      toast.error("Failed to load GL summary data");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchGLSummary = async (companyId?: number) => {
    const targetCompanyId = companyId || parseInt(selectedCompanyId);

    if (!targetCompanyId) {
      toast.error("Please select a company");
      return;
    }

    try {
      setLoading(true);

      const response = await generalLedgerService.getGLSummaryByAccountType({
        companyID: targetCompanyId,
        fiscalYearID: selectedFiscalYearId ? parseInt(selectedFiscalYearId) : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      setSummaryData(response);

      if (response.length === 0) {
        toast.info("No GL summary data found for the selected criteria");
      }
    } catch (error) {
      console.error("Error fetching GL summary:", error);
      toast.error("Failed to load GL summary");
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    setSummaryData([]);

    if (value) {
      fetchGLSummary(parseInt(value));
    }
  };

  const handleFiscalYearChange = (value: string) => {
    setSelectedFiscalYearId(value);
    setSummaryData([]);

    // Update default date range
    const fiscalYear = fiscalYears.find((fy) => fy.FiscalYearID === parseInt(value));
    if (fiscalYear) {
      setFromDate(format(new Date(fiscalYear.StartDate), "yyyy-MM-dd"));
      setToDate(format(new Date(fiscalYear.EndDate), "yyyy-MM-dd"));
    }
  };

  const handleRefresh = () => {
    fetchGLSummary();
  };

  const handleExport = () => {
    toast.info("Export functionality will be implemented");
  };

  const handleViewDetails = (accountTypeId: number) => {
    const params = new URLSearchParams({
      companyId: selectedCompanyId,
      fiscalYearId: selectedFiscalYearId || "",
      accountTypeId: accountTypeId.toString(),
    });
    navigate(`/general-ledger/chart-of-accounts?${params.toString()}`);
  };

  const formatCurrency = (amount: number): string => {
    if (amount === 0) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (number: number): string => {
    return new Intl.NumberFormat("en-US").format(number);
  };

  const getFilteredFiscalYears = () => {
    if (!selectedCompanyId) return fiscalYears;
    return fiscalYears.filter((fy) => fy.CompanyID === parseInt(selectedCompanyId));
  };

  // Calculate totals
  const totalAccounts = summaryData.reduce((sum, item) => sum + item.AccountCount, 0);
  const totalVouchers = summaryData.reduce((sum, item) => sum + item.VoucherCount, 0);
  const totalDebits = summaryData.reduce((sum, item) => sum + item.TotalDebits, 0);
  const totalCredits = summaryData.reduce((sum, item) => sum + item.TotalCredits, 0);
  const totalNetBalance = summaryData.reduce((sum, item) => sum + Math.abs(item.NetBalance), 0);

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
            <h1 className="text-2xl font-semibold">GL Summary</h1>
            <p className="text-muted-foreground">Summary analysis by account type</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={summaryData.length === 0}>
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
          <CardDescription>Select criteria for the GL summary report</CardDescription>
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
              <Label htmlFor="fiscalYear">Fiscal Year (Optional)</Label>
              <Select value={selectedFiscalYearId} onValueChange={handleFiscalYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Fiscal Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Periods</SelectItem>
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
              <Label htmlFor="fromDate">From Date (Optional)</Label>
              <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toDate">To Date (Optional)</Label>
              <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
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
                "Generate Report"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Header Info */}
      {summaryData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedCompany?.CompanyName}</p>
                  <p className="text-sm text-muted-foreground">GL Summary by Account Type</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-right">
                  <p className="font-medium">
                    {fromDate && toDate
                      ? `${format(new Date(fromDate), "MMM dd")} - ${format(new Date(toDate), "MMM dd, yyyy")}`
                      : selectedFiscalYear?.FYDescription || "All Periods"}
                  </p>
                  <p className="text-sm text-muted-foreground">{summaryData.length} account types</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {summaryData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Account Types</p>
              <p className="text-2xl font-bold">{summaryData.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Accounts</p>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(totalAccounts)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Vouchers</p>
              <p className="text-2xl font-bold text-purple-600">{formatNumber(totalVouchers)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Debits</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDebits)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCredits)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Table */}
      {summaryData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Account Type Summary
            </CardTitle>
            <CardDescription>Summary of general ledger activity by account type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Type</TableHead>
                    <TableHead className="text-center">Accounts</TableHead>
                    <TableHead className="text-center">Vouchers</TableHead>
                    <TableHead className="text-right">Total Debits</TableHead>
                    <TableHead className="text-right">Total Credits</TableHead>
                    <TableHead className="text-right">Net Balance</TableHead>
                    <TableHead className="text-center">Activity Period</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryData.map((item) => (
                    <TableRow key={item.AccountTypeID}>
                      <TableCell>
                        <div className="font-medium">{item.AccountTypeName}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{formatNumber(item.AccountCount)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{formatNumber(item.VoucherCount)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">{formatCurrency(item.TotalDebits)}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">{formatCurrency(item.TotalCredits)}</TableCell>
                      <TableCell className="text-right font-bold">
                        <span className={item.NetBalance >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(item.NetBalance)}</span>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {item.FirstTransactionDate && item.LastTransactionDate ? (
                          <div>
                            <div>{format(new Date(item.FirstTransactionDate), "MMM dd, yy")}</div>
                            <div className="text-muted-foreground">to</div>
                            <div>{format(new Date(item.LastTransactionDate), "MMM dd, yy")}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No Activity</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetails(item.AccountTypeID)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary Footer */}
            <div className="mt-4 p-4 bg-muted rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">Total Accounts</p>
                  <p className="font-bold text-lg">{formatNumber(totalAccounts)}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Total Vouchers</p>
                  <p className="font-bold text-lg">{formatNumber(totalVouchers)}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Total Debits</p>
                  <p className="font-bold text-lg text-green-600">{formatCurrency(totalDebits)}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Total Credits</p>
                  <p className="font-bold text-lg text-red-600">{formatCurrency(totalCredits)}</p>
                </div>
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
            <p className="text-muted-foreground mb-4">{selectedCompanyId ? "No GL summary data found for the selected criteria" : "Select a company to view GL summary"}</p>
            <Button onClick={handleRefresh} disabled={!selectedCompanyId}>
              Generate Report
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default GLSummary;
