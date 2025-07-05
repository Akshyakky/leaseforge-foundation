// src/pages/contract/ContractAnalyticsDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contractService } from "@/services/contractService";
import { terminationService } from "@/services/terminationService";
import { Calendar, BarChart3, PieChart as PieChartIcon, TrendingUp, DollarSign, FileText, Clock, AlertCircle, Plus, Users, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { format, addMonths, addDays, startOfMonth, endOfMonth } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { ContractStatistics } from "@/types/contractTypes";
import { TerminationStatistics } from "@/types/terminationTypes";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define color palettes for charts
const STATUS_COLORS = [
  "#4CAF50", // Active - Green
  "#9C27B0", // Pending - Purple
  "#2196F3", // Draft - Blue
  "#757575", // Completed - Gray
  "#FF9800", // Expired - Orange
  "#F44336", // Cancelled/Terminated - Red
];

const APPROVAL_COLORS = [
  "#9C27B0", // Pending - Purple
  "#4CAF50", // Approved - Green
  "#F44336", // Rejected - Red
];

const PROPERTY_COLORS = [
  "#3F51B5", // Indigo
  "#00BCD4", // Cyan
  "#009688", // Teal
  "#E91E63", // Pink
  "#673AB7", // Deep Purple
  "#8BC34A", // Light Green
  "#FF5722", // Deep Orange
  "#795548", // Brown
];

// Filter time periods
const TIME_PERIODS = [
  { label: "Last 30 days", value: "30days" },
  { label: "Last 90 days", value: "90days" },
  { label: "Last 6 months", value: "6months" },
  { label: "Last year", value: "1year" },
  { label: "All time", value: "all" },
];

interface DashboardData {
  contractStats: ContractStatistics;
  terminationStats: TerminationStatistics;
  totalValues: {
    activeContractsValue: number;
    totalContractsCount: number;
    averageContractValue: number;
    expiringContractsCount: number;
    pendingContractsCount: number;
    pendingTerminationsCount: number;
    pendingRefundsCount: number;
  };
}

const ContractAnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState("90days");
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [activeTab, setActiveTab] = useState("overview");

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    contractStats: {
      statusCounts: [],
      approvalCounts: [],
      propertyUnitCounts: [],
      customerCounts: [],
    },
    terminationStats: {
      statusCounts: [],
      approvalStatusCounts: [],
      monthlyTerminations: [],
      pendingRefunds: [],
      pendingApprovals: [],
    },
    totalValues: {
      activeContractsValue: 0,
      totalContractsCount: 0,
      averageContractValue: 0,
      expiringContractsCount: 0,
      pendingContractsCount: 0,
      pendingTerminationsCount: 0,
      pendingRefundsCount: 0,
    },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Load contract and termination statistics in parallel
      const [contractStats, terminationStats] = await Promise.all([contractService.getContractStatistics(), terminationService.getTerminationStatistics()]);

      // Calculate total values
      const totalValues = calculateTotalValues(contractStats, terminationStats);

      setDashboardData({
        contractStats,
        terminationStats,
        totalValues,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateTotalValues = (contractStats: ContractStatistics, terminationStats: TerminationStatistics) => {
    // Calculate totals from contract statistics
    const activeContract = contractStats.statusCounts.find((s) => s.ContractStatus === "Active");
    const pendingContract = contractStats.statusCounts.find((s) => s.ContractStatus === "Pending");
    const pendingApproval = contractStats.approvalCounts.find((a) => a.ApprovalStatus === "Pending");

    const totalContractsCount = contractStats.statusCounts.reduce((sum, item) => sum + item.ContractCount, 0);
    const activeContractsValue = activeContract?.TotalAmount || 0;
    const averageContractValue = activeContract && activeContract.ContractCount > 0 ? activeContractsValue / activeContract.ContractCount : 0;

    // Get termination-related counts
    const pendingTerminationsCount = terminationStats.pendingApprovals.length;
    const pendingRefundsCount = terminationStats.pendingRefunds.length;

    // For expiring contracts, we'll need to implement a separate API call
    // For now, using a placeholder value
    const expiringContractsCount = 0; // This would require a separate API call with date filtering

    return {
      activeContractsValue,
      totalContractsCount,
      averageContractValue,
      expiringContractsCount,
      pendingContractsCount: pendingApproval?.ContractCount || 0,
      pendingTerminationsCount,
      pendingRefundsCount,
    };
  };

  const handleCreateContract = () => {
    navigate("/contracts/new");
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderPendingRefunds = () => {
    if (dashboardData.terminationStats.pendingRefunds.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">No pending refunds at this time.</div>;
    }

    return dashboardData.terminationStats.pendingRefunds.map((refund, index) => (
      <div key={index} className="p-4 border-b flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/terminations/${refund.TerminationID}`)}>
        <div>
          <div className="font-medium">{refund.TerminationNo}</div>
          <div className="text-sm text-gray-500">{refund.CustomerFullName}</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{refund.ContractNo}</div>
          <div className="text-sm text-gray-500">{format(new Date(refund.EffectiveDate), "MMM dd, yyyy")}</div>
        </div>
        <div className="text-right">
          <div className="font-medium">{formatCurrency(refund.RefundAmount)}</div>
          <div className="text-sm text-amber-600">Pending refund</div>
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Contract Analytics</h1>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contract Analytics</h1>
          <p className="text-gray-500">Monitor and analyze contract performance</p>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateContract}>
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="overview">
            <PieChartIcon className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <FileText className="mr-2 h-4 w-4" />
            Contract Analysis
          </TabsTrigger>
          <TabsTrigger value="terminations">
            <Clock className="mr-2 h-4 w-4" />
            Termination Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Quick Stat Cards */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Active Contracts Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalValues.activeContractsValue)}</div>
                <p className="text-xs text-muted-foreground">Total value of active contracts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalValues.totalContractsCount}</div>
                <p className="text-xs text-muted-foreground">Across all statuses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalValues.pendingContractsCount}</div>
                <p className="text-xs text-muted-foreground">Contracts awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Average Contract Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalValues.averageContractValue)}</div>
                <p className="text-xs text-muted-foreground">Per active contract</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contract Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Status Distribution</CardTitle>
                <CardDescription>Breakdown of contracts by current status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.contractStats.statusCounts}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="ContractCount"
                      nameKey="ContractStatus"
                    >
                      {dashboardData.contractStats.statusCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value} Contracts (${formatCurrency(props.payload.TotalAmount)})`, "Count & Value"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Approval Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Approval Status Distribution</CardTitle>
                <CardDescription>Breakdown of contracts by approval status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.contractStats.approvalCounts}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="ContractCount"
                      nameKey="ApprovalStatus"
                    >
                      {dashboardData.contractStats.approvalCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={APPROVAL_COLORS[index % APPROVAL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value} Contracts (${formatCurrency(props.payload.TotalAmount)})`, "Count & Value"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Contract Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Contracts by Property</CardTitle>
                <CardDescription>Active contracts distribution across properties</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.contractStats.propertyUnitCounts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="PropertyName" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [name === "UnitCount" ? `${value} Units` : formatCurrency(value as number), name === "UnitCount" ? "Units" : "Total Value"]}
                    />
                    <Legend />
                    <Bar dataKey="UnitCount" name="Units" fill="#3F51B5" />
                    <Bar dataKey="TotalAmount" name="Total Value" fill="#00BCD4" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>By contract count and total value</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.contractStats.customerCounts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="CustomerFullName" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "ContractCount" ? `${value} Contracts` : formatCurrency(value as number),
                        name === "ContractCount" ? "Contracts" : "Total Value",
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="ContractCount" name="Contracts" fill="#8884d8" />
                    <Bar dataKey="TotalAmount" name="Total Value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contracts">
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Contract Performance Metrics */}
              {dashboardData.contractStats.statusCounts.map((status, index) => (
                <Card key={status.ContractStatus}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{status.ContractStatus} Contracts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{status.ContractCount}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(status.TotalAmount)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Contract Status vs Value Analysis</CardTitle>
                <CardDescription>Comparison of contract counts and their respective values</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.contractStats.statusCounts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ContractStatus" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "ContractCount" ? `${value} Contracts` : formatCurrency(value as number),
                        name === "ContractCount" ? "Count" : "Total Value",
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="ContractCount" name="Contract Count" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="TotalAmount" name="Total Value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="terminations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Termination Metrics */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Pending Terminations</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalValues.pendingTerminationsCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalValues.pendingRefundsCount}</div>
                <p className="text-xs text-muted-foreground">Refunds to process</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Total Refund Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.terminationStats.pendingRefunds.reduce((sum, refund) => sum + refund.RefundAmount, 0))}</div>
                <p className="text-xs text-muted-foreground">Total pending refunds</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Monthly Terminations</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.terminationStats.monthlyTerminations.reduce((sum, month) => sum + month.TerminationCount, 0)}</div>
                <p className="text-xs text-muted-foreground">This year total</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Termination Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Termination Status Distribution</CardTitle>
                <CardDescription>Breakdown by termination status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.terminationStats.statusCounts}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="TerminationCount"
                      nameKey="TerminationStatus"
                    >
                      {dashboardData.terminationStats.statusCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Terminations`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Termination Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Termination Trend</CardTitle>
                <CardDescription>Termination count by month</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.terminationStats.monthlyTerminations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="MonthName" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} Terminations`, "Count"]} />
                    <Legend />
                    <Line type="monotone" dataKey="TerminationCount" name="Terminations" stroke="#F44336" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending Refunds</CardTitle>
              <CardDescription>Terminations with pending refund processing</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {dashboardData.terminationStats.pendingRefunds.length > 0 ? (
                <div className="max-h-96 overflow-auto">{renderPendingRefunds()}</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No pending refunds at this time.</div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">{dashboardData.terminationStats.pendingRefunds.length} pending refunds</div>
              <Button variant="outline" size="sm" onClick={() => navigate("/terminations?filter=pending-refunds")}>
                View All
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractAnalyticsDashboard;
