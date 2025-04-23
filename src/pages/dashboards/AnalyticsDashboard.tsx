import React from "react";
import { ArrowUpIcon, ArrowDownIcon, TrendingUp, Users, CreditCard, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, BarChart, Bar } from "recharts";
import { DashboardCard } from "@/components/data-display/DashboardCard";

// Sample data for analytics
const sessionData = [
  { name: "Jan", users: 4000, sessions: 2400, newUsers: 2400 },
  { name: "Feb", users: 3000, sessions: 1398, newUsers: 2210 },
  { name: "Mar", users: 2000, sessions: 9800, newUsers: 2290 },
  { name: "Apr", users: 2780, sessions: 3908, newUsers: 2000 },
  { name: "May", users: 1890, sessions: 4800, newUsers: 2181 },
  { name: "Jun", users: 2390, sessions: 3800, newUsers: 2500 },
  { name: "Jul", users: 3490, sessions: 4300, newUsers: 2100 },
];

const trafficSourceData = [
  { name: "Direct", value: 40 },
  { name: "Organic Search", value: 30 },
  { name: "Referral", value: 20 },
  { name: "Social", value: 10 },
];

const deviceData = [
  { name: "Desktop", value: 55 },
  { name: "Mobile", value: 35 },
  { name: "Tablet", value: 10 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const AnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Last 7 Days
          </Button>
          <Button size="sm">Export Report</Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Users"
          value="12,548"
          subtitle="Active users"
          trend={{ value: 12.5, positive: true, label: "vs last month" }}
          icon={<Users className="h-4 w-4 text-blue-500" />}
        />
        <DashboardCard
          title="Sessions"
          value="32,489"
          subtitle="Total sessions"
          trend={{ value: 8.2, positive: true, label: "vs last month" }}
          icon={<Activity className="h-4 w-4 text-emerald-500" />}
        />
        <DashboardCard
          title="Avg. Session Duration"
          value="4m 32s"
          subtitle="Time on site"
          trend={{ value: 3.1, positive: false, label: "vs last month" }}
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
        <DashboardCard
          title="Conversion Rate"
          value="3.42%"
          subtitle="Purchases"
          trend={{ value: 6.8, positive: true, label: "vs last month" }}
          icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Website Traffic</CardTitle>
            <CardDescription>User sessions and engagement over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="sessions" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="newUsers" stackId="3" stroke="#ffc658" fill="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Distribution of visit origins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {trafficSourceData.map((entry, index) => (
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

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Devices Overview</CardTitle>
            <CardDescription>User device distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Page Views", value: 4300 },
                    { name: "Unique Views", value: 2800 },
                    { name: "Clicks", value: 1908 },
                    { name: "Conversions", value: 703 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
