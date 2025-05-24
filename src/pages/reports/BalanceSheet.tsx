// src/pages/reports/BalanceSheet.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Calendar, Download, Printer, FileText, RefreshCw } from "lucide-react";
import { accountService } from "@/services/accountService";
import { companyService } from "@/services/companyService";
import { BalanceSheetItem } from "@/types/accountTypes";
import { format } from "date-fns";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface CompanyOption {
  CompanyID: number;
  CompanyName: string;
}

export const BalanceSheet: React.FC = () => {
  // State for filters
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  // State for data
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesData = await companyService.getCompaniesForDropdown(true);
        setCompanies(companiesData);

        // Set default company if available
        if (companiesData.length > 0) {
          // const defaultCompany = companiesData.find((c) => c.IsDefault);
          // if (defaultCompany) {
          //   setSelectedCompanyId(defaultCompany.CompanyID.toString());
          // } else
          {
            setSelectedCompanyId(companiesData[0].CompanyID.toString());
          }
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
        toast.error("Failed to load companies");
      }
    };

    fetchCompanies();
  }, []);

  // Fetch balance sheet data when filters change
  useEffect(() => {
    const fetchBalanceSheetData = async () => {
      if (!asOfDate) return;

      setLoading(true);
      setError(null);

      try {
        const companyId = selectedCompanyId ? parseInt(selectedCompanyId) : undefined;
        const formattedDate = format(asOfDate, "yyyy-MM-dd");

        const data = await accountService.getBalanceSheet(formattedDate, companyId);
        setBalanceSheetData(data);
      } catch (err) {
        console.error("Error fetching balance sheet data:", err);
        setError("Failed to load balance sheet data");
        toast.error("Failed to load balance sheet data");
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceSheetData();
  }, [asOfDate, selectedCompanyId]);

  // Organize data into asset, liability, and equity sections
  const { assets, liabilities, equity, totals } = useMemo(() => {
    const assets = balanceSheetData.filter((item) => item.AccountTypeName?.toLowerCase().includes("asset"));

    const liabilities = balanceSheetData.filter((item) => item.AccountTypeName?.toLowerCase().includes("liability") || item.AccountTypeName?.toLowerCase().includes("liabilities"));

    const equity = balanceSheetData.filter((item) => item.AccountTypeName?.toLowerCase().includes("equity") || item.AccountTypeName?.toLowerCase().includes("capital"));

    // Calculate totals
    const totalAssets = assets.reduce((sum, item) => sum + item.CurrentBalance, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.CurrentBalance, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.CurrentBalance, 0);
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      assets,
      liabilities,
      equity,
      totals: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity,
      },
    };
  }, [balanceSheetData]);

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setAsOfDate(date);
    }
  };

  // Handle company change
  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
  };

  // Refresh data
  const handleRefresh = () => {
    const companyId = selectedCompanyId ? parseInt(selectedCompanyId) : undefined;
    const formattedDate = format(asOfDate, "yyyy-MM-dd");

    setLoading(true);
    accountService
      .getBalanceSheet(formattedDate, companyId)
      .then((data) => {
        setBalanceSheetData(data);
        toast.success("Balance sheet data refreshed");
      })
      .catch((err) => {
        console.error("Error refreshing balance sheet data:", err);
        toast.error("Failed to refresh balance sheet data");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel function (simplified)
  const handleExport = () => {
    toast.info("Export functionality will be implemented based on your export library of choice");
    // Implementation would depend on the export library used (xlsx, exceljs, etc.)
  };

  // Helper function to render account rows with proper indentation
  const renderAccountRows = (accounts: BalanceSheetItem[]) => {
    return accounts.map((account, index) => (
      <TableRow key={`${account.AccountID}-${index}`}>
        <TableCell className="font-medium" style={{ paddingLeft: `${(account.AccountLevel || 1) * 1.5}rem` }}>
          {account.AccountCode} - {account.AccountName}
        </TableCell>
        <TableCell className="text-right">{account.CurrentBalance.toFixed(2)}</TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Balance Sheet</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Balance Sheet Report</CardTitle>
          <CardDescription>View financial position as of a specific date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">As of Date</span>
                <DatePicker value={asOfDate} onChange={handleDateChange} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Company</span>
                <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Companies</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.CompanyID} value={company.CompanyID.toString()}>
                        {company.CompanyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p className="text-lg">{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-8 overflow-auto print:overflow-visible">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">{selectedCompanyId ? companies.find((c) => c.CompanyID.toString() === selectedCompanyId)?.CompanyName : "All Companies"}</h2>
                <h3 className="text-lg font-semibold">Balance Sheet</h3>
                <p className="text-muted-foreground">As of {format(asOfDate, "MMMM dd, yyyy")}</p>
              </div>

              {/* Assets Section */}
              <div>
                <h3 className="text-lg font-bold mb-2">Assets</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            No asset accounts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        renderAccountRows(assets)
                      )}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell>Total Assets</TableCell>
                        <TableCell className="text-right">{totals.totalAssets.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Liabilities Section */}
              <div>
                <h3 className="text-lg font-bold mb-2">Liabilities</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liabilities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            No liability accounts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        renderAccountRows(liabilities)
                      )}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell>Total Liabilities</TableCell>
                        <TableCell className="text-right">{totals.totalLiabilities.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Equity Section */}
              <div>
                <h3 className="text-lg font-bold mb-2">Equity</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equity.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            No equity accounts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        renderAccountRows(equity)
                      )}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell>Total Equity</TableCell>
                        <TableCell className="text-right">{totals.totalEquity.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total Liabilities and Equity */}
              <div className="border rounded-md">
                <Table>
                  <TableBody>
                    <TableRow className="font-bold bg-primary/10">
                      <TableCell>Total Liabilities and Equity</TableCell>
                      <TableCell className="text-right">{totals.totalLiabilitiesAndEquity.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Verification */}
              <div className="border rounded-md mt-4">
                <Table>
                  <TableBody>
                    <TableRow className={totals.totalAssets === totals.totalLiabilitiesAndEquity ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}>
                      <TableCell>Balance Verification</TableCell>
                      <TableCell className="text-right">
                        {totals.totalAssets === totals.totalLiabilitiesAndEquity
                          ? "Balanced ✓"
                          : `Unbalanced: Difference of ${Math.abs(totals.totalAssets - totals.totalLiabilitiesAndEquity).toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceSheet;
