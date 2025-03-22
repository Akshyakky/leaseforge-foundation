import React from "react";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, Building, CreditCard, FileText, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import CustomerDashboard from "./CustomerDashboard";

const DashboardCard = ({
  title,
  value,
  description,
  trend,
  trendValue,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string;
  description: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  icon: React.ElementType;
  iconColor: string;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${iconColor} bg-opacity-10`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="mt-2 flex items-center text-xs">
          {trend === "up" && <ArrowUpIcon className="mr-1 h-3 w-3 text-emerald-500" />}
          {trend === "down" && <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />}
          {trend === "neutral" && <ArrowRightIcon className="mr-1 h-3 w-3 text-amber-500" />}
          <span
            className={`
            ${trend === "up" && "text-emerald-500"}
            ${trend === "down" && "text-red-500"}
            ${trend === "neutral" && "text-amber-500"}
          `}
          >
            {trendValue}
          </span>
          <span className="text-muted-foreground ml-1">vs. last month</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Sample data for charts
const barChartData = [
  { name: "Jan", value: 23 },
  { name: "Feb", value: 45 },
  { name: "Mar", value: 32 },
  { name: "Apr", value: 56 },
  { name: "May", value: 42 },
  { name: "Jun", value: 65 },
  { name: "Jul", value: 54 },
];

const lineChartData = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 600 },
  { name: "Mar", value: 550 },
  { name: "Apr", value: 780 },
  { name: "May", value: 650 },
  { name: "Jun", value: 850 },
  { name: "Jul", value: 900 },
];

const pieChartData = [
  { name: "Office", value: 40 },
  { name: "Retail", value: 25 },
  { name: "Industry", value: 20 },
  { name: "Other", value: 15 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Download Report
          </Button>
          <Button size="sm">New Lease</Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Active Leases" value="128" description="Total active lease contracts" trend="up" trendValue="12%" icon={FileText} iconColor="text-blue-500" />
        <DashboardCard title="Total Revenue" value="$285,248" description="Total revenue this month" trend="up" trendValue="8.2%" icon={CreditCard} iconColor="text-emerald-500" />
        <DashboardCard title="Companies" value="64" description="Total partner companies" trend="neutral" trendValue="0%" icon={Building} iconColor="text-violet-500" />
        <DashboardCard title="Clients" value="1,842" description="Total client accounts" trend="up" trendValue="3.4%" icon={Users} iconColor="text-amber-500" />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Leases</CardTitle>
            <CardDescription>Number of new leases per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lease Types</CardTitle>
            <CardDescription>Distribution by property type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue from lease contracts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <CustomerDashboard />
    </div>
  );
};

export default Dashboard;
