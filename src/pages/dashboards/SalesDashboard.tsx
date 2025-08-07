import React from "react";
import { HandCoins, ShoppingCart, CreditCard, TrendingUp, Users, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart, Area } from "recharts";
import { DashboardCard } from "@/components/data-display/DashboardCard";

// Sample data for sales
const salesData = [
  { name: "Jan", revenue: 4000, profit: 2400, orders: 240 },
  { name: "Feb", revenue: 3000, profit: 1398, orders: 210 },
  { name: "Mar", revenue: 9800, profit: 2000, orders: 290 },
  { name: "Apr", revenue: 3908, profit: 2780, orders: 200 },
  { name: "May", revenue: 4800, profit: 1890, orders: 218 },
  { name: "Jun", revenue: 3800, profit: 2390, orders: 250 },
  { name: "Jul", revenue: 4300, profit: 3490, orders: 210 },
];

const topProductsData = [
  { name: "Product A", sales: 4000 },
  { name: "Product B", sales: 3000 },
  { name: "Product C", sales: 2000 },
  { name: "Product D", sales: 2780 },
  { name: "Product E", sales: 1890 },
];

const customerSegmentation = [
  { name: "New", value: 30 },
  { name: "Returning", value: 45 },
  { name: "Loyal", value: 25 },
];

const SalesDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Sales Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            This Quarter
          </Button>
          <Button size="sm">Export Data</Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Revenue"
          value="$124,563.00"
          subtitle="Current period"
          trend={{ value: 14.6, positive: true, label: "vs last period" }}
          icon={<HandCoins className="h-4 w-4 text-emerald-500" />}
        />
        <DashboardCard
          title="Orders"
          value="1,243"
          subtitle="Total orders"
          trend={{ value: 5.2, positive: true, label: "vs last period" }}
          icon={<ShoppingCart className="h-4 w-4 text-blue-500" />}
        />
        <DashboardCard
          title="Average Order Value"
          value="$102.50"
          subtitle="Per transaction"
          trend={{ value: 2.3, positive: true, label: "vs last period" }}
          icon={<CreditCard className="h-4 w-4 text-purple-500" />}
        />
        <DashboardCard
          title="Conversion Rate"
          value="3.76%"
          subtitle="From visitors"
          trend={{ value: 0.8, positive: false, label: "vs last period" }}
          icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
        />
      </div>

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Profit Overview</CardTitle>
            <CardDescription>Monthly revenue and profit trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid stroke="#f5f5f5" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" fill="#8884d8" stroke="#8884d8" />
                  <Bar dataKey="profit" barSize={20} fill="#413ea0" />
                  <Line type="monotone" dataKey="orders" stroke="#ff7300" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products by sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Forecast</CardTitle>
            <CardDescription>Projected sales for next quarter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { month: "Aug", actual: 4200, forecast: 4200 },
                    { month: "Sep", actual: 4500, forecast: 4500 },
                    { month: "Oct", actual: null, forecast: 5100 },
                    { month: "Nov", actual: null, forecast: 5400 },
                    { month: "Dec", actual: null, forecast: 6200 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#8884d8" strokeWidth={2} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="forecast" stroke="#82ca9d" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesDashboard;
