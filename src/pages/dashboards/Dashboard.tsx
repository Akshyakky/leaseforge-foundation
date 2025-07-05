import React from "react";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, Building, CreditCard, FileText, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import CustomerDashboard from "./CustomerDashboard";
import ContractAnalyticsDashboard from "../contract/ContractAnalyticsDashboard";

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

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <ContractAnalyticsDashboard />
      <CustomerDashboard />
    </div>
  );
};

export default Dashboard;
