import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { departmentService, Department } from "@/services/departmentService";
import { ArrowLeft, Loader2, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { DashboardCard } from "@/components/data-display/DashboardCard";

interface DepartmentStats {
  DepartmentID: number;
  DepartmentName: string;
  UserCount: number;
  ActiveUserCount: number;
  RoleCount?: number;
}

interface RoleDistribution {
  RoleID: number;
  RoleName: string;
  UserCount: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const DepartmentStatistics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | null>(null);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate("/departments");
        return;
      }

      try {
        setLoading(true);

        // Fetch department details
        const departmentData = await departmentService.getDepartmentById(parseInt(id));
        if (!departmentData) {
          toast.error("Department not found");
          navigate("/departments");
          return;
        }
        setDepartment(departmentData);

        // Fetch department statistics
        const statsData = await departmentService.getDepartmentStatistics(parseInt(id));
        if (statsData.departmentStats && statsData.departmentStats.length > 0) {
          setStats(statsData.departmentStats[0]);
        }

        if (statsData.roleDistribution) {
          setRoleDistribution(statsData.roleDistribution);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load department statistics");
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
        <Button variant="outline" size="icon" onClick={() => navigate("/departments")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Department Statistics: {department?.DepartmentName}</h1>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard title="Total Users" value={stats?.UserCount.toString() || "0"} subtitle="Users in department" icon={<Users className="h-4 w-4 text-blue-500" />} />
        <DashboardCard
          title="Active Users"
          value={stats?.ActiveUserCount.toString() || "0"}
          subtitle="Currently active"
          icon={<UserCheck className="h-4 w-4 text-emerald-500" />}
        />
        <DashboardCard
          title="Active Rate"
          value={`${activeUsersPercentage}%`}
          subtitle="Of total users"
          trend={{ value: activeUsersPercentage - 50, positive: activeUsersPercentage >= 50, label: "of total" }}
          icon={<Users className="h-4 w-4 text-amber-500" />}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Status Distribution</CardTitle>
            <CardDescription>Active vs. Inactive users in department</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {stats && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Active Users", value: stats.ActiveUserCount },
                      { name: "Inactive Users", value: stats.UserCount - stats.ActiveUserCount },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell key="active" fill="#4ade80" />
                    <Cell key="inactive" fill="#fb7185" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>Users by role in department</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {roleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="RoleName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="UserCount" name="Number of Users" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No role distribution data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex">
        <Button variant="outline" onClick={() => navigate(`/departments/${id}/users`)} className="mr-2">
          <Users className="mr-2 h-4 w-4" />
          View Users
        </Button>
        <Button variant="outline" onClick={() => navigate(`/departments/edit/${id}`)}>
          Edit Department
        </Button>
      </div>
    </div>
  );
};

export default DepartmentStatistics;
