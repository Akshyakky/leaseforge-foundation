import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, UserPlus, Users, UserCheck, FileText, Building, Calendar, TrendingUp } from "lucide-react";
import { customerService } from "@/services/customerService";
import { useNavigate } from "react-router-dom";
import { DashboardCard } from "@/components/data-display/DashboardCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { toast } from "sonner";

// Import the comprehensive types from the service
interface CustomerDashboardData {
  statistics: {
    TotalCustomers: number;
    ActiveCustomers: number;
    CustomersThisMonth: number;
    CustomersLastMonth: number;
    CustomersThisYear: number;
    CustomersWithContacts: number;
    CustomersWithAttachments: number;
    CustomersWithGLAccounts: number;
    DocumentsExpiringSoon: number;
    AvgContactsPerCustomer: number;
    AvgAttachmentsPerCustomer: number;
  };
  typeDistribution: {
    TypeID: number;
    TypeName: string;
    CustomerCount: number;
    Percentage: number;
  }[];
  countryDistribution: {
    CountryID: number;
    CountryName: string;
    CustomerCount: number;
    Percentage: number;
  }[];
  monthlyTrend: {
    Year: number;
    Month: number;
    MonthName: string;
    CustomerCount: number;
  }[];
  statusSummary: {
    Metric: string;
    Value: string;
  }[];
}

interface ExpiringDocument {
  CustomerAttachmentID: number;
  CustomerID: number;
  DocumentName: string;
  DocExpiryDate: string;
  DaysToExpiry: number;
  CustomerFullName: string;
  CustomerNo: string;
  DocTypeName: string;
}

// Color palette for charts
const CHART_COLORS = [
  "#3F51B5", // Indigo
  "#00BCD4", // Cyan
  "#009688", // Teal
  "#E91E63", // Pink
  "#673AB7", // Deep Purple
  "#8BC34A", // Light Green
  "#FF5722", // Deep Orange
  "#795548", // Brown
];

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<CustomerDashboardData>({
    statistics: {
      TotalCustomers: 0,
      ActiveCustomers: 0,
      CustomersThisMonth: 0,
      CustomersLastMonth: 0,
      CustomersThisYear: 0,
      CustomersWithContacts: 0,
      CustomersWithAttachments: 0,
      CustomersWithGLAccounts: 0,
      DocumentsExpiringSoon: 0,
      AvgContactsPerCustomer: 0,
      AvgAttachmentsPerCustomer: 0,
    },
    typeDistribution: [],
    countryDistribution: [],
    monthlyTrend: [],
    statusSummary: [],
  });
  const [expiringDocuments, setExpiringDocuments] = useState<ExpiringDocument[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState({
    currentMonthGrowth: 0,
    previousMonthGrowth: 0,
    growthPercentage: 0,
    yearToDateGrowth: 0,
  });
  const [engagementMetrics, setEngagementMetrics] = useState({
    engagementRate: 0,
    contactCoverage: 0,
    attachmentCoverage: 0,
    glAccountCoverage: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all dashboard data in parallel
        const [dashboardStats, expDocsData, growthStats, engagementStats] = await Promise.all([
          customerService.getCustomerStatistics(),
          customerService.getExpiringDocuments(),
          customerService.getCustomerGrowthStats(),
          customerService.getCustomerEngagementMetrics(),
        ]);

        setDashboardData(dashboardStats);
        setExpiringDocuments(expDocsData);
        setGrowthMetrics(growthStats);
        setEngagementMetrics(engagementStats);
      } catch (error) {
        console.error("Error fetching customer dashboard data:", error);
        toast.error("Failed to load customer dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate engagement rate for display
  const getEngagementRateColor = (rate: number) => {
    if (rate >= 80) return "text-emerald-500";
    if (rate >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  // Format chart data
  const typeDistributionChartData = dashboardData.typeDistribution.map((item) => ({
    name: item.TypeName,
    value: item.CustomerCount,
    percentage: item.Percentage,
  }));

  const countryDistributionChartData = dashboardData.countryDistribution.slice(0, 6).map((item) => ({
    name: item.CountryName,
    value: item.CustomerCount,
    percentage: item.Percentage,
  }));

  const monthlyTrendChartData = dashboardData.monthlyTrend.slice(-6).map((item) => ({
    month: item.MonthName,
    customers: item.CustomerCount,
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Overview</h2>
          <p className="text-muted-foreground">Monitor customer metrics and growth trends</p>
        </div>
        <Button onClick={() => navigate("/customers/new")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Customers"
          value={dashboardData.statistics.TotalCustomers.toString()}
          subtitle="All registered customers"
          icon={<Users className="h-4 w-4 text-blue-500" />}
        />

        <DashboardCard
          title="Active Customers"
          value={dashboardData.statistics.ActiveCustomers.toString()}
          subtitle={`${engagementMetrics.engagementRate.toFixed(1)}% engagement rate`}
          icon={<UserCheck className={`h-4 w-4 ${getEngagementRateColor(engagementMetrics.engagementRate)}`} />}
        />

        <DashboardCard
          title="New This Month"
          value={dashboardData.statistics.CustomersThisMonth.toString()}
          subtitle="Added this month"
          trend={{
            value: growthMetrics.growthPercentage,
            positive: growthMetrics.growthPercentage >= 0,
            label: "vs last month",
          }}
          icon={<UserPlus className="h-4 w-4 text-purple-500" />}
        />

        <DashboardCard
          title="Documents Expiring"
          value={dashboardData.statistics.DocumentsExpiringSoon.toString()}
          subtitle="Next 30 days"
          icon={<FileText className="h-4 w-4 text-amber-500" />}
          onClick={() => navigate("/customers?filter=expiring-docs")}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="With Contacts"
          value={dashboardData.statistics.CustomersWithContacts.toString()}
          subtitle={`${engagementMetrics.contactCoverage.toFixed(1)}% coverage`}
          icon={<Users className="h-4 w-4 text-green-500" />}
        />

        <DashboardCard
          title="With Attachments"
          value={dashboardData.statistics.CustomersWithAttachments.toString()}
          subtitle={`${engagementMetrics.attachmentCoverage.toFixed(1)}% coverage`}
          icon={<FileText className="h-4 w-4 text-orange-500" />}
        />

        <DashboardCard
          title="With GL Accounts"
          value={dashboardData.statistics.CustomersWithGLAccounts.toString()}
          subtitle={`${engagementMetrics.glAccountCoverage.toFixed(1)}% coverage`}
          icon={<Building className="h-4 w-4 text-indigo-500" />}
        />

        <DashboardCard
          title="Year to Date"
          value={growthMetrics.yearToDateGrowth.toString()}
          subtitle="New customers this year"
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
        />
      </div>

      {/* Charts and Detailed Views */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Customer Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Types</CardTitle>
            <CardDescription>Distribution of customers by type</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {typeDistributionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistributionChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  >
                    {typeDistributionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} customers`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No customer type data available</div>
            )}
          </CardContent>
        </Card>

        {/* Country Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Top countries by customer count</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {countryDistributionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryDistributionChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`${value} customers`, "Count"]} />
                  <Bar dataKey="value" name="Customers" fill="#3F51B5" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No country distribution data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend and Expiring Documents */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Monthly Customer Growth Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Growth Trend</CardTitle>
            <CardDescription>Monthly customer additions over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {monthlyTrendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} customers`, "New Customers"]} />
                  <Line type="monotone" dataKey="customers" name="New Customers" stroke="#3F51B5" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No trend data available</div>
            )}
          </CardContent>
        </Card>

        {/* Documents Expiring Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              Documents Expiring Soon
            </CardTitle>
            <CardDescription>Documents requiring attention in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {expiringDocuments.length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {expiringDocuments.slice(0, 5).map((doc) => (
                  <div key={doc.CustomerAttachmentID} className="flex items-start border-b pb-2 last:border-b-0">
                    <div className="mr-4 flex-none">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                          doc.DaysToExpiry <= 7 ? "bg-red-100 text-red-800" : doc.DaysToExpiry <= 15 ? "bg-amber-100 text-amber-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {doc.DaysToExpiry}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium">{doc.DocumentName}</div>
                      <div className="text-sm text-muted-foreground">
                        {doc.CustomerFullName} ({doc.CustomerNo})
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {doc.DocTypeName} • Expires: {new Date(doc.DocExpiryDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="ghost" className="flex-none" size="sm" onClick={() => navigate(`/customers/${doc.CustomerID}`)}>
                      View
                    </Button>
                  </div>
                ))}
                {expiringDocuments.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/customers?filter=expiring-docs")}>
                      View All {expiringDocuments.length} Documents
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">No documents expiring soon</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      {dashboardData.statusSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Customer-related financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {dashboardData.statusSummary.map((summary, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">{summary.Metric}</span>
                  <span className="text-lg font-bold">{summary.Value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerDashboard;
