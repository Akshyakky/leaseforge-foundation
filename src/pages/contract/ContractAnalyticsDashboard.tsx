// src/pages/contract/ContractAnalyticsDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contractService } from "@/services/contractService";
import { Calendar, BarChart3, PieChart as PieChartIcon, TrendingUp, DollarSign, FileText, Clock, AlertCircle, Plus, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { format, addMonths, addDays, startOfMonth, endOfMonth } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

// Define color palettes for charts
const STATUS_COLORS = [
  "#4CAF50", // Active - Green
  "#9C27B0", // Pending - Purple
  "#2196F3", // Draft - Blue
  "#757575", // Completed - Gray
  "#FF9800", // Expired - Orange
  "#F44336", // Cancelled/Terminated - Red
];

const CUSTOMER_COLORS = [
  "#3F51B5", // Indigo
  "#00BCD4", // Cyan
  "#009688", // Teal
  "#E91E63", // Pink
  "#673AB7", // Deep Purple
  "#8BC34A", // Light Green
];

const PROPERTY_COLORS = [
  "#FF5722", // Deep Orange
  "#795548", // Brown
  "#607D8B", // Blue Gray
  "#FFEB3B", // Yellow
  "#9E9E9E", // Gray
  "#CDDC39", // Lime
];

// Filter time periods
const TIME_PERIODS = [
  { label: "Last 30 days", value: "30days" },
  { label: "Last 90 days", value: "90days" },
  { label: "Last 6 months", value: "6months" },
  { label: "Last year", value: "1year" },
  { label: "All time", value: "all" },
];

const ContractAnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("90days");
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null });
  const [activeTab, setActiveTab] = useState("overview");

  // Dashboard data states
  const [statistics, setStatistics] = useState<any>({
    statusCounts: [],
    propertyUnitCounts: [],
    customerCounts: [],
    monthlyCounts: [],
    valueDistribution: [],
    expiringContracts: [],
    renewalRates: [],
  });

  // Total value calculations
  const [totalValues, setTotalValues] = useState({
    activeContractsValue: 0,
    totalContractsCount: 0,
    averageContractValue: 0,
    expiringContractsCount: 0,
    pendingContractsCount: 0,
  });

  // Filter states
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    // Load properties and customers for filters
    const loadFilterData = async () => {
      try {
        // These would be actual API calls in a real implementation
        // For now, using placeholder data
        setProperties([
          { PropertyID: 1, PropertyName: "Property A" },
          { PropertyID: 2, PropertyName: "Property B" },
          { PropertyID: 3, PropertyName: "Property C" },
        ]);

        setCustomers([
          { CustomerID: 1, CustomerName: "Customer X" },
          { CustomerID: 2, CustomerName: "Customer Y" },
          { CustomerID: 3, CustomerName: "Customer Z" },
        ]);
      } catch (error) {
        console.error("Error loading filter data:", error);
      }
    };

    loadFilterData();
  }, []);

  useEffect(() => {
    loadContractData();
  }, [timePeriod, customDateRange, selectedProperty, selectedCustomer]);

  const loadContractData = async () => {
    setIsLoading(true);
    try {
      // Get date range based on selected time period
      const { startDate, endDate } = getDateRangeFromPeriod(timePeriod, customDateRange);

      // Fetch contract statistics
      const contractStats = await contractService.getContractStatistics();

      // Process and filter data based on selected date range
      const processedData = processContractData(contractStats, startDate, endDate);
      setStatistics(processedData);

      // Calculate total values
      calculateTotalValues(processedData);
    } catch (error) {
      console.error("Error loading contract data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRangeFromPeriod = (period: string, customRange: any) => {
    const now = new Date();
    let startDate: Date,
      endDate: Date = now;

    switch (period) {
      case "30days":
        startDate = addDays(now, -30);
        break;
      case "90days":
        startDate = addDays(now, -90);
        break;
      case "6months":
        startDate = addMonths(now, -6);
        break;
      case "1year":
        startDate = addMonths(now, -12);
        break;
      case "custom":
        startDate = customRange.start || addDays(now, -30);
        endDate = customRange.end || now;
        break;
      case "all":
      default:
        startDate = new Date(2010, 0, 1); // Arbitrary date in the past
        break;
    }

    return { startDate, endDate };
  };

  const processContractData = (data: any, startDate: Date, endDate: Date) => {
    // This would filter and process the data based on the date range
    // For this implementation, we'll use placeholder data

    // Generate monthly contract counts
    const monthlyCounts = generateMonthlyData(startDate, endDate);

    // Process status counts
    const statusCounts = data.statusCounts || [
      { ContractStatus: "Active", ContractCount: 45 },
      { ContractStatus: "Pending", ContractCount: 12 },
      { ContractStatus: "Draft", ContractCount: 8 },
      { ContractStatus: "Completed", ContractCount: 23 },
      { ContractStatus: "Expired", ContractCount: 7 },
      { ContractStatus: "Terminated", ContractCount: 5 },
    ];

    // Process property unit counts
    const propertyUnitCounts = data.propertyUnitCounts || [
      { PropertyName: "Property A", UnitCount: 15 },
      { PropertyName: "Property B", UnitCount: 22 },
      { PropertyName: "Property C", UnitCount: 18 },
      { PropertyName: "Property D", UnitCount: 10 },
      { PropertyName: "Property E", UnitCount: 8 },
    ];

    // Process customer counts
    const customerCounts = data.customerCounts || [
      { CustomerName: "Customer X", ContractCount: 12, ContractValue: 350000 },
      { CustomerName: "Customer Y", ContractCount: 8, ContractValue: 275000 },
      { CustomerName: "Customer Z", ContractCount: 15, ContractValue: 420000 },
      { CustomerName: "Customer W", ContractCount: 5, ContractValue: 180000 },
    ];

    // Generate value distribution
    const valueDistribution = [
      { range: "0-1K", count: 15 },
      { range: "1K-5K", count: 25 },
      { range: "5K-10K", count: 18 },
      { range: "10K-50K", count: 12 },
      { range: "50K+", count: 5 },
    ];

    // Generate expiring contracts
    const expiringContracts = [
      { ContractNo: "C-001", CustomerName: "Customer X", PropertyName: "Property A", ExpiryDate: "2025-05-15", DaysLeft: 14, ContractValue: 35000 },
      { ContractNo: "C-008", CustomerName: "Customer Y", PropertyName: "Property B", ExpiryDate: "2025-05-22", DaysLeft: 21, ContractValue: 42000 },
      { ContractNo: "C-015", CustomerName: "Customer Z", PropertyName: "Property C", ExpiryDate: "2025-06-03", DaysLeft: 33, ContractValue: 28000 },
      { ContractNo: "C-023", CustomerName: "Customer W", PropertyName: "Property A", ExpiryDate: "2025-06-15", DaysLeft: 45, ContractValue: 39000 },
      { ContractNo: "C-031", CustomerName: "Customer X", PropertyName: "Property D", ExpiryDate: "2025-07-02", DaysLeft: 62, ContractValue: 51000 },
    ];

    // Generate renewal rates
    const renewalRates = [
      { month: "Jan", renewed: 82, expired: 18 },
      { month: "Feb", renewed: 78, expired: 22 },
      { month: "Mar", renewed: 85, expired: 15 },
      { month: "Apr", renewed: 90, expired: 10 },
      { month: "May", renewed: 87, expired: 13 },
      { month: "Jun", renewed: 82, expired: 18 },
    ];

    return {
      statusCounts,
      propertyUnitCounts,
      customerCounts,
      monthlyCounts,
      valueDistribution,
      expiringContracts,
      renewalRates,
    };
  };

  const generateMonthlyData = (startDate: Date, endDate: Date) => {
    const months = [];
    let currentDate = startOfMonth(startDate);
    const lastMonth = endOfMonth(endDate);

    while (currentDate <= lastMonth) {
      const monthName = format(currentDate, "MMM yyyy");
      // Generate random data for demonstration
      months.push({
        month: monthName,
        new: Math.floor(Math.random() * 20) + 5,
        active: Math.floor(Math.random() * 40) + 20,
        expired: Math.floor(Math.random() * 10),
      });

      currentDate = addMonths(currentDate, 1);
    }

    return months;
  };

  const calculateTotalValues = (data: any) => {
    // Calculate total values from the processed data
    const activeContracts = data.statusCounts.find((s: any) => s.ContractStatus === "Active");
    const pendingContracts = data.statusCounts.find((s: any) => s.ContractStatus === "Pending");

    const totalCount = data.statusCounts.reduce((sum: number, item: any) => sum + item.ContractCount, 0);

    // For active contract value, we would ideally have that in the data
    // For this example, we'll use a placeholder calculation
    const activeContractsValue = activeContracts ? activeContracts.ContractCount * 35000 : 0; // Assuming average value of $35,000

    setTotalValues({
      activeContractsValue,
      totalContractsCount: totalCount,
      averageContractValue: totalCount > 0 ? activeContractsValue / (activeContracts?.ContractCount || 1) : 0,
      expiringContractsCount: data.expiringContracts.length,
      pendingContractsCount: pendingContracts?.ContractCount || 0,
    });
  };

  const handleCreateContract = () => {
    navigate("/contracts/new");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderExpiringContracts = () => {
    return statistics.expiringContracts.map((contract: any, index: number) => (
      <div key={index} className="p-4 border-b flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/contracts/${contract.ContractNo}`)}>
        <div>
          <div className="font-medium">{contract.ContractNo}</div>
          <div className="text-sm text-gray-500">{contract.CustomerName}</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{contract.PropertyName}</div>
          <div className="text-sm text-gray-500">{contract.ExpiryDate}</div>
        </div>
        <div className="text-right">
          <div className="font-medium">{formatCurrency(contract.ContractValue)}</div>
          <div className={`text-sm ${contract.DaysLeft < 30 ? "text-red-500" : "text-amber-500"}`}>{contract.DaysLeft} days left</div>
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contract Analytics</h1>
          <p className="text-gray-500">Monitor and analyze contract performance</p>
        </div>
        <div className="flex space-x-4">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom date range</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleCreateContract}>
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        </div>
      </div>

      {timePeriod === "custom" && (
        <div className="flex items-center space-x-4 mb-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Start Date</p>
            <DatePicker value={customDateRange.start} onChange={(date) => setCustomDateRange({ ...customDateRange, start: date })} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">End Date</p>
            <DatePicker
              value={customDateRange.end}
              onChange={(date) => setCustomDateRange({ ...customDateRange, end: date })}
              disabled={(date) => (customDateRange.start ? date < customDateRange.start : false)}
            />
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="overview">
            <PieChartIcon className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <FileText className="mr-2 h-4 w-4" />
            Contract Analysis
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
                <div className="text-2xl font-bold">{formatCurrency(totalValues.activeContractsValue)}</div>
                <p className="text-xs text-muted-foreground">Total value of active contracts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalValues.totalContractsCount}</div>
                <p className="text-xs text-muted-foreground">Across all statuses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Average Contract Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValues.averageContractValue)}</div>
                <p className="text-xs text-muted-foreground">Per active contract</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalValues.expiringContractsCount}</div>
                <p className="text-xs text-muted-foreground">Contracts expiring in 90 days</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contract Status Distribution */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Contract Status Distribution</CardTitle>
                <CardDescription>Breakdown of contracts by current status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statistics.statusCounts}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="ContractCount"
                      nameKey="ContractStatus"
                    >
                      {statistics.statusCounts.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Contracts`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Property Contract Distribution */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Contracts by Property</CardTitle>
                <CardDescription>Distribution of contracts across properties</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.propertyUnitCounts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="PropertyName" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} Units`, "Count"]} />
                    <Legend />
                    <Bar dataKey="UnitCount" name="Units" fill="#3F51B5" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6">
            {/* Monthly Contract Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Contract Trend</CardTitle>
                <CardDescription>New, active, and expired contracts over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statistics.monthlyCounts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="new" name="New Contracts" stroke="#4CAF50" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="active" name="Active Contracts" stroke="#2196F3" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="expired" name="Expired Contracts" stroke="#F44336" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>By contract value and count</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.customerCounts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="CustomerName" />
                    <Tooltip formatter={(value, name) => [name === "ContractValue" ? formatCurrency(value as number) : value, name === "ContractValue" ? "Value" : "Count"]} />
                    <Legend />
                    <Bar dataKey="ContractCount" name="Number of Contracts" fill="#8884d8" barSize={20} />
                    <Bar dataKey="ContractValue" name="Contract Value" fill="#82ca9d" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contract Renewal Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Renewal Rate</CardTitle>
                <CardDescription>Percentage of renewed vs. expired contracts</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.renewalRates} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Legend />
                    <Bar dataKey="renewed" name="Renewed" stackId="a" fill="#4CAF50" />
                    <Bar dataKey="expired" name="Expired" stackId="a" fill="#F44336" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contracts">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Value Distribution</CardTitle>
                  <CardDescription>Breakdown of contracts by value range</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.valueDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} Contracts`, "Count"]} />
                      <Legend />
                      <Bar dataKey="count" name="Number of Contracts" fill="#3F51B5" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Contract Duration</CardTitle>
                  <CardDescription>Average contract length</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center flex-col h-64">
                  <div className="text-5xl font-bold">2.4</div>
                  <div className="text-xl mt-2">Years</div>
                  <Separator className="my-4" />
                  <div className="text-sm text-muted-foreground text-center">
                    <div className="mb-2">
                      <span className="font-medium">Minimum:</span> 6 months
                    </div>
                    <div>
                      <span className="font-medium">Maximum:</span> 5 years
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contracts Expiring Soon</CardTitle>
                <CardDescription>Upcoming contract expirations in the next 90 days</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {statistics.expiringContracts.length > 0 ? (
                  <div className="max-h-96 overflow-auto">{renderExpiringContracts()}</div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No contracts expiring soon.</div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">{statistics.expiringContracts.length} contracts expiring soon</div>
                <Button variant="outline" size="sm" onClick={() => navigate("/contracts?filter=expiring")}>
                  View All
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractAnalyticsDashboard;
