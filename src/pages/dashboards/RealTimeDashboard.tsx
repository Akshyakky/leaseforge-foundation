import React, { useState, useEffect, useMemo } from "react";
import { contractService } from "@/services/contractService";
import { terminationService } from "@/services/terminationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { useNavigate } from "react-router-dom";
import { format, subDays, differenceInDays } from "date-fns";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from "recharts";
import { ArrowUp, ArrowDown, DollarSign, FileText, Users, BarChart3, Clock, RefreshCw, AlertTriangle, Calendar, PieChart as PieIcon, Loader2 } from "lucide-react";

// Status colors for charts
const CONTRACT_STATUS_COLORS = {
  Active: "#4CAF50",
  Pending: "#9C27B0",
  Draft: "#2196F3",
  Completed: "#757575",
  Expired: "#FF9800",
  Cancelled: "#F44336",
  Terminated: "#F44336",
};

const TERMINATION_STATUS_COLORS = {
  Draft: "#2196F3",
  Pending: "#9C27B0",
  Approved: "#4CAF50",
  Completed: "#757575",
  Cancelled: "#F44336",
};

// Chart colors palette
const CHART_COLORS = ["#3F51B5", "#00BCD4", "#009688", "#E91E63", "#673AB7", "#8BC34A", "#FF5722"];

// Time intervals for auto-refresh
const REFRESH_INTERVALS = [
  { label: "None", value: 0 },
  { label: "30 seconds", value: 30 * 1000 },
  { label: "1 minute", value: 60 * 1000 },
  { label: "5 minutes", value: 5 * 60 * 1000 },
  { label: "15 minutes", value: 15 * 60 * 1000 },
];

// Time periods for filtering
const TIME_PERIODS = [
  { label: "Last 7 days", value: "7days" },
  { label: "Last 30 days", value: "30days" },
  { label: "Last 90 days", value: "90days" },
  { label: "Last 6 months", value: "6months" },
  { label: "Last year", value: "1year" },
  { label: "All time", value: "all" },
];

const RealTimeDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshInterval, setRefreshInterval] = useState(60 * 1000); // Default to 1 minute
  const [timePeriod, setTimePeriod] = useState("30days");
  const [activeTab, setActiveTab] = useState("overview");

  // Data state
  const [contractStats, setContractStats] = useState({
    statusCounts: [],
    propertyUnitCounts: [],
    customerCounts: [],
  });
  const [terminationStats, setTerminationStats] = useState({
    statusCounts: [],
    monthlyTerminations: [],
    pendingRefunds: [],
  });

  // Derived KPIs and metrics
  const kpis = useMemo(() => {
    // Contract KPIs
    const activeContracts = contractStats.statusCounts.find((s) => s.ContractStatus === "Active");
    const expiredContracts = contractStats.statusCounts.find((s) => s.ContractStatus === "Expired");
    const pendingContracts = contractStats.statusCounts.find((s) => s.ContractStatus === "Pending");
    const totalContracts = contractStats.statusCounts.reduce((sum, item) => sum + item.ContractCount, 0);

    // Termination KPIs
    const pendingTerminations = terminationStats.statusCounts.find((s) => s.TerminationStatus === "Pending");
    const approvedTerminations = terminationStats.statusCounts.find((s) => s.TerminationStatus === "Approved");
    const completedTerminations = terminationStats.statusCounts.find((s) => s.TerminationStatus === "Completed");
    const totalTerminations = terminationStats.statusCounts.reduce((sum, item) => sum + item.TerminationCount, 0);

    // Calculate termination rate (ratio of terminations to active contracts)
    const terminationRate = activeContracts?.ContractCount > 0 ? ((totalTerminations / activeContracts.ContractCount) * 100).toFixed(1) : 0;

    // Calculate renewal rate (assuming completed contracts minus terminated is renewed)
    const completedContracts = contractStats.statusCounts.find((s) => s.ContractStatus === "Completed");
    const terminatedContracts = contractStats.statusCounts.find((s) => s.ContractStatus === "Terminated");
    const renewalRate =
      completedContracts?.ContractCount > 0
        ? (((completedContracts.ContractCount - (terminatedContracts?.ContractCount || 0)) / completedContracts.ContractCount) * 100).toFixed(1)
        : 0;

    // Pending refund amount
    const totalPendingRefunds = terminationStats.pendingRefunds.reduce((sum, item) => sum + (item.RefundAmount || 0), 0);

    return {
      activeContracts: activeContracts?.ContractCount || 0,
      totalContracts: totalContracts || 0,
      pendingContracts: pendingContracts?.ContractCount || 0,
      expiringContracts: expiredContracts?.ContractCount || 0,
      pendingTerminations: pendingTerminations?.TerminationCount || 0,
      approvedTerminations: approvedTerminations?.TerminationCount || 0,
      totalTerminations: totalTerminations || 0,
      terminationRate: terminationRate,
      renewalRate: renewalRate,
      pendingRefunds: terminationStats.pendingRefunds.length,
      totalPendingRefundAmount: totalPendingRefunds,
    };
  }, [contractStats, terminationStats]);

  // Fetch data function
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);

      // Fetch contract and termination statistics in parallel
      const [contractStatsData, terminationStatsData] = await Promise.all([contractService.getContractStatistics(), terminationService.getTerminationStatistics()]);

      setContractStats(contractStatsData);
      setTerminationStats(terminationStatsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Set up auto-refresh interval
  useEffect(() => {
    let intervalId;

    if (refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchDashboardData();
      }, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshInterval]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchDashboardData();
  };

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare chart data
  const prepareChartData = () => {
    // Contract status pie chart data
    const contractStatusData = contractStats.statusCounts.map((item) => ({
      name: item.ContractStatus,
      value: item.ContractCount,
    }));

    // Termination status pie chart data
    const terminationStatusData = terminationStats.statusCounts.map((item) => ({
      name: item.TerminationStatus,
      value: item.TerminationCount,
    }));

    // Combined monthly trend data
    const monthlyTrendData = [];
    const monthsMap = new Map();

    // Process contract monthly data and termination monthly data to combine them
    terminationStats.monthlyTerminations.forEach((item) => {
      monthsMap.set(item.month, {
        month: item.month,
        terminations: item.TerminationCount || 0,
      });
    });

    // Combine with contract data (placeholder - you would need to get actual monthly contract data)
    // This would come from contractStats if available
    Array.from(monthsMap.values()).forEach((item) => {
      monthlyTrendData.push({
        month: item.month,
        terminations: item.terminations,
        newContracts: Math.floor(Math.random() * 20) + 5, // Placeholder for demo
      });
    });

    return {
      contractStatusData,
      terminationStatusData,
      monthlyTrendData,
      propertyData: contractStats.propertyUnitCounts || [],
    };
  };

  const chartData = prepareChartData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Dashboard</h1>
          <p className="text-muted-foreground">Contract and Termination Analytics • Last updated: {format(lastUpdated, "MMM d, yyyy HH:mm:ss")}</p>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Auto-refresh:</span>
            <Select value={refreshInterval.toString()} onValueChange={(val) => setRefreshInterval(parseInt(val))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_INTERVALS.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value.toString()}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={handleManualRefresh} disabled={refreshing} className="flex items-center">
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Data
          </Button>

          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="overview">
            <PieIcon className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <FileText className="mr-2 h-4 w-4" />
            Contracts
          </TabsTrigger>
          <TabsTrigger value="terminations">
            <Calendar className="mr-2 h-4 w-4" />
            Terminations
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.activeContracts}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <span className={`flex items-center ${kpis.activeContracts > kpis.pendingContracts ? "text-green-500" : "text-amber-500"}`}>
                    {kpis.activeContracts > kpis.pendingContracts ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                    {kpis.pendingContracts} pending
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Termination Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.terminationRate}%</div>
                <p className="text-xs text-muted-foreground">{kpis.totalTerminations} terminations total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Contract Renewal Rate</CardTitle>
                <RefreshCw className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.renewalRate}%</div>
                <p className="text-xs text-muted-foreground">Based on completed contracts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
                <DollarSign className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(kpis.totalPendingRefundAmount)}</div>
                <p className="text-xs text-muted-foreground">{kpis.pendingRefunds} refunds awaiting processing</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Contract Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Status Distribution</CardTitle>
                <CardDescription>Current distribution of contracts by status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.contractStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.contractStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CONTRACT_STATUS_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Contracts`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Termination Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Termination Status Distribution</CardTitle>
                <CardDescription>Current distribution of terminations by status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.terminationStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.terminationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TERMINATION_STATUS_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Terminations`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Contract & Termination Trends</CardTitle>
              <CardDescription>New contracts vs terminations over time</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData.monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="newContracts" name="New Contracts" fill="#4CAF50" />
                  <Line type="monotone" dataKey="terminations" name="Terminations" stroke="#F44336" strokeWidth={2} dot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab Content */}
        <TabsContent value="contracts">
          {/* Contract KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalContracts}</div>
                <p className="text-xs text-muted-foreground">All contract statuses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                <FileText className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.activeContracts}</div>
                <p className="text-xs text-muted-foreground">{((kpis.activeContracts / kpis.totalContracts) * 100).toFixed(1)}% of total contracts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Pending Contracts</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.pendingContracts}</div>
                <p className="text-xs text-muted-foreground">Awaiting activation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.expiringContracts}</div>
                <p className="text-xs text-muted-foreground">Contracts expiring in 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Contract Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Contract Status */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Status Breakdown</CardTitle>
                <CardDescription>Distribution of contracts by current status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contractStats.statusCounts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="ContractStatus" type="category" />
                    <Tooltip formatter={(value) => [`${value} Contracts`, "Count"]} />
                    <Legend />
                    <Bar dataKey="ContractCount" name="Contracts" fill="#3F51B5" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contracts by Property */}
            <Card>
              <CardHeader>
                <CardTitle>Contracts by Property</CardTitle>
                <CardDescription>Distribution of contracts across properties</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.propertyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="PropertyName" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} Units`, "Count"]} />
                    <Legend />
                    <Bar dataKey="UnitCount" name="Units" fill="#00BCD4" />
                    <Bar dataKey="TotalAmount" name="Value" fill="#4CAF50" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Expiring Contracts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Contracts Expiring Soon</CardTitle>
              <CardDescription>Contracts due to expire in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-72">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Contract #</th>
                      <th className="text-left p-2">Customer</th>
                      <th className="text-left p-2">Property</th>
                      <th className="text-left p-2">Expiry Date</th>
                      <th className="text-left p-2">Days Left</th>
                      <th className="text-right p-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* This would be populated with real data, using dummy data for now */}
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">C-0045</td>
                      <td className="p-2">Acme Corporation</td>
                      <td className="p-2">River View Tower</td>
                      <td className="p-2">May 15, 2025</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-amber-500">
                          14 days
                        </Badge>
                      </td>
                      <td className="p-2 text-right">$65,000</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">C-0048</td>
                      <td className="p-2">Global Industries</td>
                      <td className="p-2">Park Avenue Plaza</td>
                      <td className="p-2">May 22, 2025</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-amber-500">
                          21 days
                        </Badge>
                      </td>
                      <td className="p-2 text-right">$48,500</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2">C-0051</td>
                      <td className="p-2">Johnson Enterprises</td>
                      <td className="p-2">Sunset Business Center</td>
                      <td className="p-2">May 28, 2025</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-amber-500">
                          27 days
                        </Badge>
                      </td>
                      <td className="p-2 text-right">$72,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terminations Tab Content */}
        <TabsContent value="terminations">
          {/* Termination KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Total Terminations</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalTerminations}</div>
                <p className="text-xs text-muted-foreground">All termination statuses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Pending Terminations</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.pendingTerminations}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Approved Terminations</CardTitle>
                <FileText className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.approvedTerminations}</div>
                <p className="text-xs text-muted-foreground">Ready for processing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
                <DollarSign className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(kpis.totalPendingRefundAmount)}</div>
                <p className="text-xs text-muted-foreground">{kpis.pendingRefunds} refunds to process</p>
              </CardContent>
            </Card>
          </div>

          {/* Termination Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Termination Status */}
            <Card>
              <CardHeader>
                <CardTitle>Termination Status Breakdown</CardTitle>
                <CardDescription>Distribution of terminations by current status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={terminationStats.statusCounts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="TerminationStatus" type="category" />
                    <Tooltip formatter={(value) => [`${value} Terminations`, "Count"]} />
                    <Legend />
                    <Bar dataKey="TerminationCount" name="Terminations" fill="#E91E63" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Terminations */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Termination Trend</CardTitle>
                <CardDescription>Terminations by month</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={terminationStats.monthlyTerminations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} Terminations`, "Count"]} />
                    <Legend />
                    <Line type="monotone" dataKey="TerminationCount" name="Terminations" stroke="#FF5722" strokeWidth={2} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Pending Refunds Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Refunds</CardTitle>
              <CardDescription>Refunds awaiting processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-72">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Termination #</th>
                      <th className="text-left p-2">Contract #</th>
                      <th className="text-left p-2">Customer</th>
                      <th className="text-left p-2">Termination Date</th>
                      <th className="text-right p-2">Refund Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terminationStats.pendingRefunds.length > 0 ? (
                      terminationStats.pendingRefunds.map((refund, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2">{refund.TerminationNo}</td>
                          <td className="p-2">{refund.ContractNo}</td>
                          <td className="p-2">{refund.CustomerFullName}</td>
                          <td className="p-2">{format(new Date(refund.TerminationDate), "MMM d, yyyy")}</td>
                          <td className="p-2 text-right">{formatCurrency(refund.RefundAmount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          No pending refunds found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeDashboard;
