import React from "react";
import { Truck, Package, FileText, AlertCircle, CheckCircle, Clock, UserCheck, FileWarning } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { DashboardCard } from "@/components/data-display/DashboardCard";

// Sample data for operations
const deliveryStatusData = [
  { name: "Delivered", value: 65 },
  { name: "In Transit", value: 25 },
  { name: "Processing", value: 8 },
  { name: "Delayed", value: 2 },
];

const inventoryData = [
  { category: "Electronics", stock: 240, capacity: 300 },
  { category: "Clothing", stock: 180, capacity: 250 },
  { category: "Home Goods", stock: 120, capacity: 200 },
  { category: "Books", stock: 90, capacity: 150 },
  { category: "Sports", stock: 60, capacity: 100 },
];

const issuesByDepartment = [
  { name: "Warehouse", critical: 3, medium: 7, minor: 12 },
  { name: "Logistics", critical: 2, medium: 5, minor: 10 },
  { name: "Support", critical: 5, medium: 11, minor: 8 },
  { name: "Procurement", critical: 1, medium: 4, minor: 9 },
];

const deliveryTimeData = [
  { day: "Mon", time: 28 },
  { day: "Tue", time: 24 },
  { day: "Wed", time: 32 },
  { day: "Thu", time: 26 },
  { day: "Fri", time: 22 },
  { day: "Sat", time: 30 },
  { day: "Sun", time: 34 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const OperationsDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Operations Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Last Week
          </Button>
          <Button size="sm">Refresh Data</Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Orders Processing"
          value="142"
          subtitle="In queue"
          trend={{ value: 5, positive: false, label: "more than yesterday" }}
          icon={<FileText className="h-4 w-4 text-blue-500" />}
        />
        <DashboardCard
          title="On-Time Delivery"
          value="94.7%"
          subtitle="Current rate"
          trend={{ value: 1.2, positive: true, label: "vs target" }}
          icon={<Truck className="h-4 w-4 text-emerald-500" />}
        />
        <DashboardCard
          title="Inventory Alerts"
          value="7"
          subtitle="Low stock items"
          trend={{ value: 3, positive: false, label: "new alerts" }}
          icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
        />
        <DashboardCard
          title="Active Issues"
          value="23"
          subtitle="Requiring attention"
          trend={{ value: 4, positive: true, label: "resolved today" }}
          icon={<FileWarning className="h-4 w-4 text-rose-500" />}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Capacity</CardTitle>
            <CardDescription>Current stock levels by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stock" fill="#8884d8" name="Current Stock" />
                  <Bar dataKey="capacity" fill="#82ca9d" name="Total Capacity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current delivery status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {deliveryStatusData.map((entry, index) => (
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
            <CardTitle>Issues by Department</CardTitle>
            <CardDescription>Open issues categorized by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={issuesByDepartment} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="critical" stackId="a" fill="#ff6b6b" name="Critical" />
                  <Bar dataKey="medium" stackId="a" fill="#feca57" name="Medium" />
                  <Bar dataKey="minor" stackId="a" fill="#1dd1a1" name="Minor" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Delivery Time</CardTitle>
            <CardDescription>Hours from order to delivery by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deliveryTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} hours`, "Avg. Delivery Time"]} />
                  <Line type="monotone" dataKey="time" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OperationsDashboard;
