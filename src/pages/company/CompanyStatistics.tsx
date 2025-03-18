import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { companyService, Company } from "@/services/companyService";
import { ArrowLeft, Loader2, Users, Building, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { DashboardCard } from "@/components/data-display/DashboardCard";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const CompanyStatistics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [departmentDistribution, setDepartmentDistribution] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate("/companies");
        return;
      }

      try {
        setLoading(true);

        // Fetch company details
        const companyData = await companyService.getCompanyById(parseInt(id));
        if (!companyData) {
          toast.error("Company not found");
          navigate("/companies");
          return;
        }
        setCompany(companyData);

        // Fetch company statistics
        const statsData = await companyService.getCompanyStatistics(parseInt(id));

        if (statsData.companyStats) {
          setStats(statsData.companyStats);
        }

        if (statsData.departmentDistribution) {
          setDepartmentDistribution(statsData.departmentDistribution);
        }

        if (statsData.roleDistribution) {
          setRoleDistribution(statsData.roleDistribution);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load company statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const activeUsersPercentage = stats ? Math.round((stats.ActiveUserCount / (stats.UserCount || 1)) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/companies")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Company Statistics: {company?.CompanyName}</h1>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-3">
        <DashboardCard title="Total Users" value={stats?.UserCount.toString() || "0"} subtitle="Users in company" icon={<Users className="h-4 w-4 text-blue-500" />} />
        <DashboardCard
          title="Active Users"
          value={stats?.ActiveUserCount.toString() || "0"}
          subtitle="Currently active"
          icon={<UserCheck className="h-4 w-4 text-emerald-500" />}
        />
        <DashboardCard title="Departments" value={stats?.DepartmentCount.toString() || "0"} subtitle="Total departments" icon={<Building className="h-4 w-4 text-amber-500" />} />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Users by department</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {departmentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="DepartmentName" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [value, "Users"]} labelFormatter={(label) => `Department: ${label}`} />
                  <Legend />
                  <Bar dataKey="UserCount" name="Number of Users" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No department data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>Users by role in company</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {roleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="UserCount"
                    nameKey="RoleName"
                    label={({ RoleName, percent }) => `${RoleName}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [value, "Users"]} labelFormatter={(label) => `Role: ${roleDistribution[label]?.RoleName}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No role distribution data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex">
        <Button variant="outline" onClick={() => navigate(`/companies/${id}/users`)} className="mr-2">
          <Users className="mr-2 h-4 w-4" />
          View Users
        </Button>
        <Button variant="outline" onClick={() => navigate(`/companies/edit/${id}`)}>
          Edit Company
        </Button>
      </div>
    </div>
  );
};

export default CompanyStatistics;
