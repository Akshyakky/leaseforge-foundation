import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, UserPlus, Users, UserCheck, FileText } from "lucide-react";
import { customerService } from "@/services/customerService";
import { useNavigate } from "react-router-dom";
import { DashboardCard } from "@/components/data-display/DashboardCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface CustomerStats {
  TotalCustomers: number;
  ActiveCustomers: number;
  CustomersThisMonth: number;
  CustomersLastMonth: number;
  TypeDistribution: {
    TypeName: string;
    Count: number;
  }[];
}

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats>({
    TotalCustomers: 0,
    ActiveCustomers: 0,
    CustomersThisMonth: 0,
    CustomersLastMonth: 0,
    TypeDistribution: [],
  });
  const [expiringDocuments, setExpiringDocuments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch customer statistics and expiring documents in parallel
        const [statsData, expDocsData] = await Promise.all([customerService.getCustomerStatistics(), customerService.getExpiringDocuments()]);

        setStats(statsData);
        setExpiringDocuments(expDocsData);
      } catch (error) {
        console.error("Error fetching customer dashboard data:", error);
        toast.error("Failed to load customer dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate growth percentage between this month and last month
  const calculateGrowthPercentage = () => {
    if (stats.CustomersLastMonth === 0) return 100; // If last month was 0, this is infinite growth, cap at 100%

    const growth = ((stats.CustomersThisMonth - stats.CustomersLastMonth) / stats.CustomersLastMonth) * 100;
    return Math.round(growth);
  };

  // Format type distribution data for chart
  const typeDistributionData = stats.TypeDistribution.map((item) => ({
    name: item.TypeName,
    value: item.Count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Customer Overview</h2>
        <Button onClick={() => navigate("/customers/new")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <DashboardCard title="Total Customers" value={stats.TotalCustomers.toString()} subtitle="All customers" icon={<Users className="h-4 w-4 text-blue-500" />} />

        <DashboardCard title="Active Customers" value={stats.ActiveCustomers.toString()} subtitle="Currently active" icon={<UserCheck className="h-4 w-4 text-emerald-500" />} />

        <DashboardCard
          title="New This Month"
          value={stats.CustomersThisMonth.toString()}
          subtitle="Added this month"
          trend={{
            value: calculateGrowthPercentage(),
            positive: calculateGrowthPercentage() >= 0,
            label: "vs last month",
          }}
          icon={<UserPlus className="h-4 w-4 text-purple-500" />}
        />

        <DashboardCard title="Documents Expiring" value={expiringDocuments.length.toString()} subtitle="Next 30 days" icon={<FileText className="h-4 w-4 text-amber-500" />} />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Customer Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Types</CardTitle>
            <CardDescription>Distribution of customers by type</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {typeDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Customers" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No customer type data available</div>
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
                {expiringDocuments.map((doc, index) => (
                  <div key={index} className="flex items-start border-b pb-2">
                    <div className="mr-4 flex-none">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-800">{doc.DaysToExpiry}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium">{doc.DocumentName}</div>
                      <div className="text-sm text-muted-foreground">
                        {doc.CustomerFullName} ({doc.CustomerNo})
                      </div>
                      <div className="text-sm text-muted-foreground">Expires: {new Date(doc.DocExpiryDate).toLocaleDateString()}</div>
                    </div>
                    <Button variant="ghost" className="flex-none" size="sm" onClick={() => navigate(`/customers/${doc.CustomerID}`)}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">No documents expiring soon</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboard;
