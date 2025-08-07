// src/pages/generalLedger/GeneralLedgerDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, BarChart3, PieChart, TrendingUp, Calculator, Building, CreditCard, Clock, ArrowRight, HandCoins, BookOpen } from "lucide-react";
import { generalLedgerService } from "@/services/generalLedgerService";
import { fiscalYearService } from "@/services/fiscalYearService";
import { companyService } from "@/services/companyService";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiscalYear } from "@/types/fiscalYearTypes";
import { Company } from "@/services/companyService";

interface QuickStat {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

const GeneralLedgerDashboard = () => {
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [currentFiscalYear, setCurrentFiscalYear] = useState<FiscalYear | null>(null);

  // Initialize dashboard data
  useEffect(() => {
    initializeDashboard();
  }, []);

  // Fetch data when company or fiscal year changes
  useEffect(() => {
    if (selectedCompanyId && selectedFiscalYearId) {
      fetchQuickStats();
    }
  }, [selectedCompanyId, selectedFiscalYearId]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);

      // Fetch companies and fiscal years
      const [companiesData, fiscalYearsData] = await Promise.all([companyService.getCompaniesForDropdown(true), fiscalYearService.getAllFiscalYears()]);

      setCompanies(companiesData);
      setFiscalYears(fiscalYearsData);

      // Set default selections
      if (companiesData.length > 0) {
        const defaultCompany = companiesData[0];
        setSelectedCompanyId(defaultCompany.CompanyID.toString());

        // Get current fiscal year for the company
        try {
          const currentFY = await fiscalYearService.getCurrentFiscalYear(defaultCompany.CompanyID);
          if (currentFY) {
            setCurrentFiscalYear(currentFY);
            setSelectedFiscalYearId(currentFY.FiscalYearID.toString());
          } else if (fiscalYearsData.length > 0) {
            // Fallback to first available fiscal year
            const companyFY = fiscalYearsData.find((fy) => fy.CompanyID === defaultCompany.CompanyID);
            if (companyFY) {
              setSelectedFiscalYearId(companyFY.FiscalYearID.toString());
            }
          }
        } catch (error) {
          console.error("Error fetching current fiscal year:", error);
          // Fallback to first available fiscal year
          if (fiscalYearsData.length > 0) {
            const companyFY = fiscalYearsData.find((fy) => fy.CompanyID === defaultCompany.CompanyID);
            if (companyFY) {
              setSelectedFiscalYearId(companyFY.FiscalYearID.toString());
            }
          }
        }
      }
    } catch (error) {
      console.error("Error initializing dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickStats = async () => {
    if (!selectedCompanyId || !selectedFiscalYearId) return;

    try {
      // Fetch trial balance for quick stats
      const trialBalance = await generalLedgerService.getTrialBalance({
        companyID: parseInt(selectedCompanyId),
        fiscalYearID: parseInt(selectedFiscalYearId),
      });

      // Calculate quick statistics
      const stats: QuickStat[] = [
        {
          title: "Total Assets",
          value: formatCurrency(trialBalance.items.filter((item) => item.AccountTypeName?.toLowerCase().includes("asset")).reduce((sum, item) => sum + item.DebitBalance, 0)),
          icon: <Building className="h-5 w-5" />,
        },
        {
          title: "Total Liabilities",
          value: formatCurrency(trialBalance.items.filter((item) => item.AccountTypeName?.toLowerCase().includes("liabilit")).reduce((sum, item) => sum + item.CreditBalance, 0)),
          icon: <CreditCard className="h-5 w-5" />,
        },
        {
          title: "Total Revenue",
          value: formatCurrency(
            trialBalance.items
              .filter((item) => item.AccountTypeName?.toLowerCase().includes("revenue") || item.AccountTypeName?.toLowerCase().includes("income"))
              .reduce((sum, item) => sum + item.CreditBalance, 0)
          ),
          icon: <TrendingUp className="h-5 w-5" />,
        },
        {
          title: "Total Expenses",
          value: formatCurrency(trialBalance.items.filter((item) => item.AccountTypeName?.toLowerCase().includes("expense")).reduce((sum, item) => sum + item.DebitBalance, 0)),
          icon: <HandCoins className="h-5 w-5" />,
        },
      ];

      setQuickStats(stats);
    } catch (error) {
      console.error("Error fetching quick stats:", error);
      // Set default stats
      setQuickStats([
        { title: "Total Assets", value: "$0.00", icon: <Building className="h-5 w-5" /> },
        { title: "Total Liabilities", value: "$0.00", icon: <CreditCard className="h-5 w-5" /> },
        { title: "Total Revenue", value: "$0.00", icon: <TrendingUp className="h-5 w-5" /> },
        { title: "Total Expenses", value: "$0.00", icon: <HandCoins className="h-5 w-5" /> },
      ]);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
    }).format(amount);
  };

  const handleCompanyChange = async (value: string) => {
    setSelectedCompanyId(value);

    // Get current fiscal year for selected company
    if (value) {
      try {
        const currentFY = await fiscalYearService.getCurrentFiscalYear(parseInt(value));
        if (currentFY) {
          setCurrentFiscalYear(currentFY);
          setSelectedFiscalYearId(currentFY.FiscalYearID.toString());
        } else {
          // Fallback to first available fiscal year for the company
          const companyFY = fiscalYears.find((fy) => fy.CompanyID === parseInt(value));
          if (companyFY) {
            setSelectedFiscalYearId(companyFY.FiscalYearID.toString());
          }
        }
      } catch (error) {
        console.error("Error fetching current fiscal year:", error);
      }
    }
  };

  const getFilteredFiscalYears = () => {
    if (!selectedCompanyId) return fiscalYears;
    return fiscalYears.filter((fy) => fy.CompanyID === parseInt(selectedCompanyId));
  };

  // Report navigation functions
  const navigateToReport = (reportPath: string) => {
    const params = new URLSearchParams({
      companyId: selectedCompanyId,
      fiscalYearId: selectedFiscalYearId,
    });
    navigate(`${reportPath}?${params.toString()}`);
  };

  // Report configuration
  const reports = [
    {
      title: "Trial Balance",
      description: "View trial balance with opening and closing balances",
      icon: <Calculator className="h-8 w-8" />,
      path: "/general-ledger/trial-balance",
      color: "bg-blue-500",
    },
    {
      title: "Balance Sheet",
      description: "Assets, liabilities, and equity statement",
      icon: <PieChart className="h-8 w-8" />,
      path: "/general-ledger/balance-sheet",
      color: "bg-green-500",
    },
    {
      title: "Income Statement",
      description: "Profit and loss statement for the period",
      icon: <TrendingUp className="h-8 w-8" />,
      path: "/general-ledger/income-statement",
      color: "bg-purple-500",
    },
    {
      title: "Account Ledger",
      description: "Detailed account transactions with running balance",
      icon: <BookOpen className="h-8 w-8" />,
      path: "/general-ledger/account-ledger",
      color: "bg-orange-500",
    },
    {
      title: "GL Transactions",
      description: "Detailed general ledger transaction listing",
      icon: <FileText className="h-8 w-8" />,
      path: "/general-ledger/transactions",
      color: "bg-cyan-500",
    },
    {
      title: "Bank Reconciliation",
      description: "Reconcile bank accounts with book balances",
      icon: <BarChart3 className="h-8 w-8" />,
      path: "/general-ledger/bank-reconciliation",
      color: "bg-red-500",
    },
  ];

  if (loading) {
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">General Ledger</h1>
          <p className="text-muted-foreground">Financial reporting and account management</p>
        </div>

        {/* Context Selectors */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
            <SelectTrigger className="w-[200px]">
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

          <Select value={selectedFiscalYearId} onValueChange={setSelectedFiscalYearId}>
            <SelectTrigger className="w-[200px]">
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

      {/* Current Context Info */}
      {currentFiscalYear && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Current Period</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(currentFiscalYear.StartDate), "MMM dd, yyyy")} - {format(new Date(currentFiscalYear.EndDate), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={currentFiscalYear.IsActive ? "default" : "secondary"}>{currentFiscalYear.IsActive ? "Active" : "Inactive"}</Badge>
                <Badge variant={currentFiscalYear.IsClosed ? "destructive" : "outline"}>{currentFiscalYear.IsClosed ? "Closed" : "Open"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.change && (
                    <p className={`text-sm ${stat.changeType === "positive" ? "text-green-600" : stat.changeType === "negative" ? "text-red-600" : "text-muted-foreground"}`}>
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className="text-muted-foreground">{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Financial Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${report.color} text-white`}>{report.icon}</div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{report.description}</p>
                <Button variant="outline" className="w-full" onClick={() => navigateToReport(report.path)} disabled={!selectedCompanyId || !selectedFiscalYearId}>
                  View Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common general ledger tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigateToReport("/general-ledger/chart-of-accounts")}
              disabled={!selectedCompanyId}
            >
              <BookOpen className="h-6 w-6" />
              <span>Chart of Accounts</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigateToReport("/general-ledger/aged-trial-balance")}
              disabled={!selectedCompanyId}
            >
              <Clock className="h-6 w-6" />
              <span>Aged Trial Balance</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigateToReport("/general-ledger/gl-summary")}
              disabled={!selectedCompanyId || !selectedFiscalYearId}
            >
              <BarChart3 className="h-6 w-6" />
              <span>GL Summary</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralLedgerDashboard;
